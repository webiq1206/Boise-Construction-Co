import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const BRAND = Object.freeze({ id: "boise-construction-co", name: "Boise Construction Co", domain: "boiseconstruction.co", url: "https://boiseconstruction.co", email: "hello@boiseconstruction.co", phone: "(208) 477-1169", phoneTel: "2084771169", city: "Meridian", state: "ID", legalParent: "P5 Home Co LLC" });
const WRONG_BRAND = /boise[\s-]*remodeling|boiseremodeling\.co|timber[\s-]*(?:and|&)[\s-]*love|jared/i;

export function assertBrandIdentity(site, profile) {
  const exact = [
    [site?.id, BRAND.id], [site?.brand, BRAND.name], [site?.domain, BRAND.domain],
    [site?.legalParent, BRAND.legalParent], [site?.nap?.phone, BRAND.phone], [site?.nap?.phoneTel, BRAND.phoneTel],
    [site?.nap?.city, BRAND.city], [site?.nap?.state, BRAND.state], [profile?.sender?.phone, BRAND.phone],
    [site?.nap?.name, BRAND.name], [site?.nap?.url, BRAND.url], [site?.nap?.email, BRAND.email],
    [profile?.sender?.name, BRAND.name], [profile?.sender?.email, BRAND.email],
    [profile?.sender?.outreachFromDomain, BRAND.domain],
  ];
  if (exact.some(([actual, expected]) => actual !== expected) || WRONG_BRAND.test(JSON.stringify({ site, profile }))) {
    throw new Error("Construction brand identity mismatch; no output was generated.");
  }
  if (site.nap.street || site.nap.postalCode) throw new Error("Public growth config must preserve service-area privacy.");
  for (const asset of [...(profile.portfolioAssets || []), ...(profile.resourceAssets || [])]) {
    const url = new URL(asset.url);
    if (url.origin !== BRAND.url || url.username || url.password) throw new Error("Construction asset must use the verified canonical origin.");
  }
  return true;
}

export function assertConstructionArtifact(artifact) {
  if (artifact.brandId !== BRAND.id || WRONG_BRAND.test(JSON.stringify(artifact))) throw new Error("Cross-brand artifact rejected.");
  for (const value of [artifact.website, artifact.fields?.website].filter(Boolean)) {
    if (new URL(value).origin !== BRAND.url) throw new Error("Cross-brand CTA rejected.");
  }
  if (artifact.fields?.email && artifact.fields.email !== BRAND.email) throw new Error("Cross-brand contact rejected.");
  for (const [key, expected] of Object.entries({ businessName: BRAND.name, legalParent: BRAND.legalParent, phone: BRAND.phone, city: BRAND.city, state: BRAND.state })) {
    if (artifact.fields?.[key] && artifact.fields[key] !== expected) throw new Error("Construction public identity field mismatch.");
  }
  if (artifact.fields?.street || artifact.fields?.postalCode) throw new Error("Public artifact must preserve service-area privacy.");
  return artifact;
}

export function loadIdentity() {
  const config = JSON.parse(readFileSync(join(ROOT, "config/scoring.json"), "utf8"));
  const profile = JSON.parse(readFileSync(join(ROOT, "config/profile.json"), "utf8"));
  assertBrandIdentity(config.site, profile);
  return { config, site: config.site, profile };
}
