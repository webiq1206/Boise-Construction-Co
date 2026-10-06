/** Offline preparation only. Nothing in this module sends, submits, or approves. */
import { BRAND, loadIdentity, assertConstructionArtifact } from "./identity.mjs";

export function draftFor(opportunity) {
  const { site, profile } = loadIdentity();
  if (opportunity.brandId !== BRAND.id) throw new Error("Opportunity is not bound to Construction.");
  const packet = ["self_serve", "review_profile"].includes(opportunity.feasibility);
  const missingInputs = ["supportedDispatch", "suppressionAndCapacityReview", "specificActionAuthorization"];
  if (!opportunity.qualified) missingInputs.push("opportunityReview");
  if (packet) missingInputs.push("platformEligibilityAndDuplicateReview");
  const common = { id: opportunity.id, brandId: BRAND.id, domain: opportunity.domain, website: BRAND.url,
    status: "draft_only", dispatchPaused: true, missingInputs };
  if (packet) return assertConstructionArtifact({ ...common, type: "packet", channel: "self_serve", submitTo: opportunity.route?.url || null,
    fields: { businessName: site.nap.name, legalParent: site.legalParent, category: site.category, city: site.nap.city,
      state: site.nap.state, phone: site.nap.phone, email: site.nap.email, website: site.nap.url,
      serviceArea: profile.descriptions.serviceArea, shortDescription: profile.descriptions.short,
      longDescription: profile.descriptions.long, photos: profile.portfolioAssets },
    checklist: ["Verify platform eligibility and existing parent/DBA listings", "Use only approved public facts", "Stop at owner-only verification or payment", "Record submission receipt separately from public visibility and a verified link"] });
  missingInputs.push("verifiedRecipient", "pageSpecificEditorialContext");
  return assertConstructionArtifact({ ...common, type: "email", channel: opportunity.feasibility || "outreach", to: null,
    subject: "Treasure Valley home-building planning resources",
    body: `Hello,\n\n${profile.descriptions.short} Our planning resources are available at ${profile.resourceAssets[0].url}.\n\n${profile.sender.name}\n${site.nap.url}\n${site.nap.phone}` });
}

export function buildArtifacts(opportunities) {
  return opportunities.filter((o) => o.qualified).map(draftFor);
}
