/**
 * Persistence layer. Uses Neon Postgres when DATABASE_URL is set (durable across
 * the ephemeral Replit cron), and falls back to the JSON data files locally so
 * everything is testable without a database.
 *
 * The engine self-migrates its own tables (CREATE TABLE IF NOT EXISTS) and is
 * intentionally decoupled from the app's drizzle schema so the headless runner
 * needs no build step.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => join(ROOT, f);
const readJSON = (f, dflt) => (existsSync(p(f)) ? JSON.parse(readFileSync(p(f), "utf8")) : dflt);
const writeJSON = (f, v) => { mkdirSync(dirname(p(f)), { recursive: true }); writeFileSync(p(f), JSON.stringify(v, null, 2) + "\n"); };

const HAS_DB = Boolean(process.env.DATABASE_URL);
let sql = null;

async function db() {
  if (sql) return sql;
  const { neon } = await import("@neondatabase/serverless");
  sql = neon(process.env.DATABASE_URL);
  return sql;
}

export const store = {
  mode: HAS_DB ? "postgres" : "json",

  async init() {
    if (!HAS_DB) return this.mode;
    const q = await db();
    await q`CREATE TABLE IF NOT EXISTS backlink_opportunities (
      id text PRIMARY KEY, domain text, data jsonb NOT NULL,
      priority real DEFAULT 0, tier text, status text DEFAULT 'new',
      updated_at timestamptz DEFAULT now())`;
    await q`CREATE TABLE IF NOT EXISTS backlink_snapshots (
      captured_on date PRIMARY KEY, dr real, live_backlinks int,
      live_refdomains int, all_time_refdomains int, created_at timestamptz DEFAULT now())`;
    await q`CREATE TABLE IF NOT EXISTS backlink_refdomains (
      domain text PRIMARY KEY, dr real, dofollow boolean,
      first_seen timestamptz DEFAULT now(), last_seen timestamptz DEFAULT now(), status text DEFAULT 'active')`;
    await q`CREATE TABLE IF NOT EXISTS backlink_queue (
      id text PRIMARY KEY, domain text, data jsonb NOT NULL, status text DEFAULT 'awaiting_approval',
      drafted_on date, sent_on timestamptz, updated_at timestamptz DEFAULT now())`;
    await q`CREATE TABLE IF NOT EXISTS backlink_disavow (
      domain text PRIMARY KEY, reason text, added_on date DEFAULT current_date)`;
    await q`CREATE TABLE IF NOT EXISTS backlink_contacts (
      domain text PRIMARY KEY, data jsonb NOT NULL, resolved_on date DEFAULT current_date)`;
    return this.mode;
  },

  // ---- opportunities -------------------------------------------------
  // Always mirrors to data/opportunities.seed.json so the file-based scorer
  // (score.mjs) and humans can read the canonical list in both modes.
  async readOpportunities() {
    if (HAS_DB) {
      const q = await db();
      const rows = await q`SELECT data FROM backlink_opportunities ORDER BY priority DESC`;
      if (rows.length) return rows.map((r) => r.data);
    }
    return readJSON("data/opportunities.seed.json", []);
  },

  async writeOpportunities(opps) {
    writeJSON("data/opportunities.seed.json", opps); // scratch for scorer + human view
    if (!HAS_DB) return;
    const q = await db();
    for (const o of opps) {
      await q`INSERT INTO backlink_opportunities (id, domain, data, priority, tier, status)
        VALUES (${o.id}, ${o.domain}, ${JSON.stringify(o)}::jsonb, ${o.priority ?? 0}, ${o.tier ?? null}, ${o.status ?? "new"})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, domain = EXCLUDED.domain,
          priority = EXCLUDED.priority, tier = EXCLUDED.tier, status = EXCLUDED.status, updated_at = now()`;
    }
  },

  // ---- link snapshots + refdomain delta ------------------------------
  async appendSnapshot(snap) {
    if (HAS_DB) {
      const q = await db();
      await q`INSERT INTO backlink_snapshots (captured_on, dr, live_backlinks, live_refdomains, all_time_refdomains)
        VALUES (${snap.date}, ${snap.dr}, ${snap.liveBacklinks ?? null}, ${snap.liveRefdomains ?? null}, ${snap.allTimeRefdomains ?? null})
        ON CONFLICT (captured_on) DO UPDATE SET dr = EXCLUDED.dr, live_backlinks = EXCLUDED.live_backlinks,
          live_refdomains = EXCLUDED.live_refdomains, all_time_refdomains = EXCLUDED.all_time_refdomains`;
    }
    const hist = readJSON("data/history/snapshots.json", []);
    hist.push(snap);
    writeJSON("data/history/snapshots.json", hist);
  },

  async lastSnapshot() {
    if (HAS_DB) {
      const q = await db();
      const rows = await q`SELECT captured_on, dr, live_refdomains FROM backlink_snapshots ORDER BY captured_on DESC LIMIT 1 OFFSET 1`;
      if (rows.length) return { date: rows[0].captured_on, dr: rows[0].dr, liveRefdomains: rows[0].live_refdomains };
    }
    const hist = readJSON("data/history/snapshots.json", []);
    return hist.length > 1 ? hist[hist.length - 2] : null;
  },

  /** Compare current live refdomains to what we last saw; return {added, lost}. */
  async syncRefdomains(rows) {
    const current = new Map(rows.map((r) => [String(r.domain).toLowerCase(), r]));
    if (HAS_DB) {
      const q = await db();
      const prev = await q`SELECT domain FROM backlink_refdomains WHERE status = 'active'`;
      const prevSet = new Set(prev.map((r) => r.domain));
      const added = [...current.keys()].filter((d) => !prevSet.has(d));
      const lost = [...prevSet].filter((d) => !current.has(d));
      for (const [domain, r] of current)
        await q`INSERT INTO backlink_refdomains (domain, dr, dofollow, last_seen, status)
          VALUES (${domain}, ${r.domain_rating ?? null}, ${(r.dofollow_links ?? 0) > 0}, now(), 'active')
          ON CONFLICT (domain) DO UPDATE SET dr = EXCLUDED.dr, dofollow = EXCLUDED.dofollow, last_seen = now(), status = 'active'`;
      for (const domain of lost)
        await q`UPDATE backlink_refdomains SET status = 'lost' WHERE domain = ${domain}`;
      return { added, lost };
    }
    const prev = readJSON("data/history/refdomains.json", {});
    const prevSet = new Set(Object.keys(prev).filter((d) => prev[d].status !== "lost"));
    const added = [...current.keys()].filter((d) => !prevSet.has(d));
    const lost = [...prevSet].filter((d) => !current.has(d));
    const next = { ...prev };
    for (const [domain, r] of current) next[domain] = { dr: r.domain_rating, dofollow: (r.dofollow_links ?? 0) > 0, status: "active" };
    for (const domain of lost) if (next[domain]) next[domain].status = "lost";
    writeJSON("data/history/refdomains.json", next);
    return { added, lost };
  },

  // ---- outreach queue ------------------------------------------------
  async readQueue() {
    if (HAS_DB) {
      const q = await db();
      const rows = await q`SELECT data FROM backlink_queue ORDER BY updated_at DESC`;
      if (rows.length) return rows.map((r) => r.data);
    }
    return readJSON("outreach/queue.json", []);
  },

  async writeQueue(items) {
    writeJSON("outreach/queue.json", items);
    if (!HAS_DB) return;
    const q = await db();
    for (const it of items) {
      await q`INSERT INTO backlink_queue (id, domain, data, status, drafted_on, sent_on)
        VALUES (${it.id || it.domain}, ${it.domain}, ${JSON.stringify(it)}::jsonb, ${it.status}, ${it.draftedOn ?? null}, ${it.sentOn ?? null})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status, sent_on = EXCLUDED.sent_on, updated_at = now()`;
    }
  },

  async addDisavow(domains, reason) {
    if (HAS_DB) {
      const q = await db();
      for (const d of domains)
        await q`INSERT INTO backlink_disavow (domain, reason) VALUES (${d}, ${reason})
          ON CONFLICT (domain) DO NOTHING`;
    }
  },

  // ---- contact cache (email discovery) -------------------------------
  async getContact(domain) {
    if (HAS_DB) {
      const q = await db();
      const rows = await q`SELECT data FROM backlink_contacts WHERE domain = ${domain}`;
      if (rows.length) return rows[0].data;
      return null;
    }
    const cache = readJSON("data/history/contacts.json", {});
    return cache[domain] || null;
  },

  async putContact(domain, rec) {
    if (HAS_DB) {
      const q = await db();
      await q`INSERT INTO backlink_contacts (domain, data) VALUES (${domain}, ${JSON.stringify(rec)}::jsonb)
        ON CONFLICT (domain) DO UPDATE SET data = EXCLUDED.data, resolved_on = current_date`;
      return;
    }
    const cache = readJSON("data/history/contacts.json", {});
    cache[domain] = rec;
    writeJSON("data/history/contacts.json", cache);
  },
};
