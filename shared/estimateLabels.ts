import type { FinishLevel, ProjectType } from "./estimateEngine";

/** Display names only. Kept out of estimateEngine so a page can show them without loading the cost book. */
export const PROJECT_LABELS: Record<ProjectType, { label: string; sub: string }> = {
  "custom-home": { label: "Custom Home", sub: "Designed from scratch for you" },
  "semi-custom-home": { label: "Semi-Custom Home", sub: "An existing plan, your choices" },
  "build-on-your-lot": { label: "Build on My Lot", sub: "You already own the land" },
  "shop-home": { label: "Shop Home", sub: "A house and a shop, one roof" },
  kitchen: { label: "Kitchen", sub: "Cabinets, counters, layout" },
  bathroom: { label: "Bathroom", sub: "Tile, fixtures, vanity" },
  "whole-home": { label: "Whole-Home", sub: "Multi-room renovation" },
  addition: { label: "Room Addition", sub: "New square footage" },
  adu: { label: "ADU / Guest House", sub: "Detached or attached unit" },
  basement: { label: "Basement Finishing", sub: "Finish your lower level" },
};

export const FINISH_LABELS: Record<FinishLevel, { label: string; sub: string }> = {
  refresh: { label: "Essential", sub: "Cosmetic upgrades, repaint" },
  "mid-range": { label: "Signature", sub: "Replace and upgrade" },
  "high-end": { label: "Premium", sub: "Premium finishes" },
  luxury: { label: "Luxury", sub: "No constraints" },
};

export const NEW_CONSTRUCTION_FINISH_LABELS: Record<FinishLevel, { label: string; sub: string }> = {
  refresh: { label: "Essential", sub: "Well built, value finishes: laminate counters, LVP and carpet, painted trim" },
  "mid-range": { label: "Signature", sub: "Our standard spec: quartz counters, tile showers, solid-core doors" },
  "high-end": { label: "Premium", sub: "Custom cabinetry, stone and hardwood, tall ceilings, upgraded windows" },
  luxury: { label: "Luxury", sub: "Specified room by room with your designer, no allowances" },
};

export const INCLUDED_SCOPE_NOTE =
  "Scope reflects the selections above. Your final scope is confirmed during consultation.";

export const APPLIANCE_DISCLAIMER =
  "Appliances are client-supplied; we'll guide your selection but do not purchase or install them.";

export function formatPlanningCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}
