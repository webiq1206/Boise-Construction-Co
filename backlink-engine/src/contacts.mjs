/**
 * Contact / email discovery. For a target domain it resolves the best available
 * outreach contact, in this order of preference:
 *
 *   1. A published email on the site (mailto: links > visible text), including
 *      de-obfuscated forms ("info [at] domain [dot] com", HTML entities).
 *   2. Hunter.io domain-search, IF HUNTER_API_KEY is set (reliable at scale).
 *   3. A role-based address (info@/contact@) VERIFIED to have MX records.
 *   4. The contact-FORM URL, when no address is published (many legit sites are
 *      form-only - this is a valid outreach channel, not a failure).
 *
 * Results are cached in the store so we do not re-crawl every run. Every result
 * carries a confidence + source so a human (and the send guard) can judge it.
 * Nothing here sends anything.
 */
import { resolveMx } from "node:dns/promises";
import { pathToFileURL } from "node:url";
import { store } from "./store.mjs";

const PAGES = ["contact", "contact-us", "about", "membership", "join", "advertise", "submit", "press", "media", "write-for-us", "get-listed"];
const ROLE_HINTS = {
  association: ["membership", "member", "join", "info", "admin", "office", "contact"],
  utility_program: ["tradeally", "trade", "efficiency", "energy", "info", "contact"],
  digital_pr: ["editor", "editorial", "press", "news", "tips", "pitch", "media", "story", "info"],
  directory: ["listings", "submit", "support", "info", "contact"],
  review_platform: ["support", "info", "contact"],
  unlinked_mention: ["editor", "info", "contact"],
  resource_page: ["editor", "webmaster", "info", "contact"],
  supplier: ["dealer", "sales", "info", "contact"],
  partnership: ["partnerships", "partner", "info", "hello", "contact"],
  prospect: ["editor", "info", "contact"],
};
const ROLE_GUESS = ["info", "contact", "hello", "office"];
const JUNK = /(example\.|sentry|wixpress|godaddy|\.png|\.jpe?g|\.gif|\.svg|\.webp|@2x|@3x|your@|youremail|email@example|name@|user@|domain\.com|no-?reply|donotreply|@sentry|test@|@2x\.)/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const cleanDomain = (d) => String(d || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
const validEmail = (e) => !JUNK.test(e) && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e);
const emailHost = (e) => e.split("@")[1] || "";

async function fetchText(url, ms = 9000) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    const r = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "user-agent": "BoiseRemodelingBacklinkBot/1.0 (+https://boiseremodeling.co)" } });
    clearTimeout(t);
    if (!r.ok) return "";
    return await r.text();
  } catch { return ""; }
}

/** Normalize common obfuscation so emails become extractable. */
function deobfuscate(html) {
  let h = html
    .replace(/&#0*64;|&#x0*40;|&commat;/gi, "@")
    .replace(/&#0*46;|&#x0*2e;|&period;/gi, ".");
  // "info [at] domain [dot] com", "info(at)domain(dot)com", "info at domain dot com"
  h = h.replace(/([a-z0-9._%+-]+)\s*(?:\[\s*at\s*\]|\(\s*at\s*\)|\{\s*at\s*\}|\s+at\s+)\s*([a-z0-9.-]+)\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+|\.)\s*([a-z]{2,})/gi, "$1@$2.$3");
  return h;
}

function extractEmails(rawHtml, domain) {
  const html = deobfuscate(rawHtml);
  const found = new Map(); // email -> { mailto, count }
  const bump = (e, mailto) => {
    e = e.toLowerCase().replace(/\.$/, "");
    if (!validEmail(e)) return;
    const cur = found.get(e) || { mailto: false, count: 0 };
    cur.mailto = cur.mailto || mailto;
    cur.count++;
    found.set(e, cur);
  };
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) bump(decodeURIComponent(m[1]), true);
  for (const m of html.matchAll(EMAIL_RE)) bump(m[0], false);
  return found;
}

function scoreEmail(email, meta, domain, category) {
  const [local, host] = email.split("@");
  let s = 0;
  if (meta.mailto) s += 40;
  s += Math.min(meta.count * 3, 15);
  const root = cleanDomain(domain);
  if (host === root || host.endsWith("." + root) || root.endsWith("." + host)) s += 25;
  else s -= 12; // off-domain email is a weaker signal
  const roles = ROLE_HINTS[category] || ["info", "contact"];
  if (roles.some((r) => local.includes(r))) s += 20;
  if (/^(info|hello|contact|office|admin|team)$/.test(local)) s += 8;
  return s;
}

async function hasMx(host) {
  try { const r = await resolveMx(host); return r.length > 0; } catch { return false; }
}

async function hunterSearch(domain, category) {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}`);
    if (!r.ok) return null;
    const j = await r.json();
    const emails = j?.data?.emails || [];
    if (!emails.length) return null;
    const roles = ROLE_HINTS[category] || ["info", "contact"];
    emails.sort((a, b) => {
      const ra = roles.some((x) => (a.value || "").includes(x)) ? 1 : 0;
      const rb = roles.some((x) => (b.value || "").includes(x)) ? 1 : 0;
      return rb - ra || (b.confidence || 0) - (a.confidence || 0);
    });
    const best = emails[0];
    return { email: best.value.toLowerCase(), confidence: best.confidence >= 80 ? "high" : best.confidence >= 50 ? "medium" : "low", source: "hunter.io" };
  } catch { return null; }
}

/** Detect a contact form and return the best form/contact URL if present. */
function detectContactForm(html, url) {
  if (/<form[\s>]/i.test(html) && /(contact|message|inquiry|get in touch|email)/i.test(html)) return url;
  return null;
}

/**
 * Resolve the best contact for one opportunity.
 * @returns {{email?:string, confidence:string, mx?:boolean, source:string, contactForm?:string, candidates?:string[]}|null}
 */
export async function findContact(opp, { maxAgeDays = 45 } = {}) {
  const domain = cleanDomain(opp.domain);
  if (!domain || ["multiple", "discovery", "various-manufacturers"].includes(domain) || domain.includes("various")) return null;

  // 0. cache - reuse a prior successful resolution (re-crawl only refreshes empties)
  const cached = await store.getContact(domain);
  if (cached && cached.email) return cached;

  // 0b. explicit override: if the opportunity's contact field is already an email
  if (opp.contact && validEmail(String(opp.contact).trim())) {
    const rec = { email: String(opp.contact).trim().toLowerCase(), confidence: "high", source: "curated", mx: await hasMx(emailHost(opp.contact)) };
    await store.putContact(domain, rec);
    return rec;
  }

  // 1. crawl the site's likely contact pages. Establish a reachable host once,
  //    then reuse it (halves fetches, stays polite).
  const found = new Map();
  let contactForm = null;
  const ingest = (html, url) => {
    for (const [e, meta] of extractEmails(html, domain)) {
      const cur = found.get(e) || { mailto: false, count: 0 };
      cur.mailto = cur.mailto || meta.mailto; cur.count += meta.count; found.set(e, cur);
    }
    if (!contactForm) contactForm = detectContactForm(html, url);
  };
  let base = null;
  for (const h of [`https://${domain}`, `https://www.${domain}`]) {
    const html = await fetchText(h);
    if (html) { base = h; ingest(html, h); break; }
  }
  if (base) {
    for (const path of PAGES) {
      if ([...found].some(([e, m]) => m.mailto && emailHost(e).endsWith(domain))) break; // strong hit already
      const html = await fetchText(`${base}/${path}`);
      if (html) ingest(html, `${base}/${path}`);
    }
  }

  if (found.size) {
    const ranked = [...found.entries()]
      .map(([email, meta]) => ({ email, score: scoreEmail(email, meta, domain, opp.category), mailto: meta.mailto }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const rec = {
      email: best.email,
      confidence: best.score >= 55 ? "high" : best.score >= 35 ? "medium" : "low",
      mx: await hasMx(emailHost(best.email)),
      source: "site-crawl",
      contactForm: contactForm || undefined,
      candidates: ranked.slice(0, 5).map((r) => r.email),
    };
    await store.putContact(domain, rec);
    return rec;
  }

  // 2. Hunter.io (optional)
  const hunter = await hunterSearch(domain, opp.category);
  if (hunter) {
    hunter.mx = await hasMx(emailHost(hunter.email));
    hunter.contactForm = contactForm || undefined;
    await store.putContact(domain, hunter);
    return hunter;
  }

  // 3. role-based guess, only if it has MX (so it is at least deliverable)
  for (const role of ROLE_GUESS) {
    const guess = `${role}@${domain}`;
    if (await hasMx(domain)) {
      const rec = { email: guess, confidence: "low", mx: true, source: "role-guess", contactForm: contactForm || undefined, note: "unverified role address; confirm before sending" };
      await store.putContact(domain, rec);
      return rec;
    }
    break; // MX is per-domain; no need to loop roles
  }

  // 4. contact form only
  if (contactForm) {
    const rec = { confidence: "form-only", source: "contact-form", contactForm };
    await store.putContact(domain, rec);
    return rec;
  }

  return null;
}

/** Resolve contacts for many opportunities (sequential to stay polite). */
export async function resolveContacts(opps) {
  const out = new Map();
  for (const o of opps) {
    try { out.set(o.id, await findContact(o)); } catch { out.set(o.id, null); }
  }
  return out;
}

// ---- CLI: node src/contacts.mjs  ->  resolve + report for email-channel P1/P2
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join, resolve: rp } = await import("node:path");
  const root = rp(dirname(fileURLToPath(import.meta.url)), "..");
  const scored = JSON.parse(readFileSync(join(root, "data/opportunities.scored.json"), "utf8"));
  const emailChannels = new Set(["application", "digital_pr", "outreach"]);
  const targets = scored.opportunities.filter((o) => o.status !== "rejected" && o.priority >= 52 && emailChannels.has(o.feasibility));
  console.log(`\nResolving contacts for ${targets.length} email-channel P1/P2 targets` + (process.env.HUNTER_API_KEY ? " (+Hunter.io)" : " (site-crawl only; set HUNTER_API_KEY for more)") + "\n");
  const pad = (s, n) => String(s ?? "").padEnd(n);
  console.log(pad("DOMAIN", 26), pad("EMAIL / METHOD", 34), pad("CONF", 9), "SRC");
  console.log("-".repeat(88));
  let hits = 0;
  for (const o of targets) {
    const c = await findContact(o);
    const val = c?.email || (c?.contactForm ? `form: ${c.contactForm}` : "not found");
    if (c?.email) hits++;
    console.log(pad(o.domain, 26), pad(val.slice(0, 33), 34), pad(c?.confidence || "-", 9), c?.source || "-");
  }
  console.log(`\n${hits}/${targets.length} resolved to a direct email address.\n`);
}
