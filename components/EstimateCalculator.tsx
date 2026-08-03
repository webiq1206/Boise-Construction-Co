"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check, ChevronDown, ArrowRight, Lock, Calculator,
  UtensilsCrossed, Droplets, Home, Building2, Layers, AlignLeft,
  LayoutGrid, Star, Sun, Monitor, Dumbbell, Bed, Car,
  Lightbulb, Wind, DoorOpen, GlassWater, Sofa, Frame, Triangle, Grid3x3,
  HardHat, Ruler, MapPin, Mountain, Trees, Users, Warehouse, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StickyEstimateBar } from "@/components/estimate/StickyEstimateBar";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  takeoffForRange,
  takeoffForClient,
  formatQuantity,
  TAKEOFF_SCOPE_NOTICE,
  type UnitCostOverrides,
} from "@/shared/costCatalog";
import { resolveQuotedRange, resolveInternalEstimate } from "@/shared/costs/resolve";
import { assessBudget, budgetGuidance, BUDGET_BASIS_NOTE } from "@/shared/costs/budget";
import type { QualityLevel, ScopeSelections } from "@/shared/costs/engine";
import { HOUSE_NUMBER_REGEX, extractZip } from "@/shared/addressValidation";
import {
  type ProjectType,
  type FinishLevel,
  type PlumbingElectrical,
  type CabinetTier,
  type EstimateRefinements,
  type EstimateInput,
  type EstimateResult,
  EMPTY_REFINEMENTS,
  getAvailableFinishLevels,
  getPlumbingElectricalOptions,
  getPlumbingElectricalLabel,
  getAssumedBathrooms,
  getAssumedBathroomsForSize,
  getKitchenQuestion,
  getTypicalSelections,
  FINISH_LABELS as ENGINE_FINISH_LABELS,
  getFinishLabels,
  isNewConstructionProject,
  PROJECT_SIZE_CONFIG,
  formatPlanningCurrency,
  calculateEstimate,
  buildStoredEstimate,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getSetRefinementKeys,
  INCLUDED_SCOPE_NOTE,
  buildEstimateDisclosure,
  NOT_A_QUOTE_NOTICE,
  getOnsiteNotice,
  APPLIANCE_DISCLAIMER,
  type PlanningStage,
  type AccessoryStructure,
  type AccessoryStructureKind,
  PLANNING_STAGES,
  PLANNING_STAGE_LABELS,
  PLANNING_STAGE_BAND,
  ACCESSORY_STRUCTURE_LABELS,
  defaultAccessoryStructure,
} from "@/shared/estimateEngine";
import type { ExtractedPlan } from "@/shared/plans/extraction";
import { applyPlanToEstimate } from "@/shared/plans/applyToEstimate";
import { UPLOAD_ACCEPT, READABLE_FORMATS_LABEL } from "@/shared/re10/uploads";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { GRAIN_URL } from "@/lib/grain";
import {
  applyLeadParams,
  writeStoredPrefill,
  readStoredPrefill,
  hasPassedGate,
  markGatePassed,
  clearStoredIdentity,
  readLastSentKey,
  writeLastSentKey,
} from "@/lib/leadPrefill";

/* Project-level icons for the project-type card grid. */
const PROJECT_ICONS: Record<ProjectType, LucideIcon> = {
  "custom-home": HardHat,
  "semi-custom-home": Ruler,
  "build-on-your-lot": MapPin,
  "shop-home": Warehouse,
  kitchen: UtensilsCrossed,
  bathroom: Droplets,
  "whole-home": Home,
  addition: Building2,
  adu: DoorOpen,
  basement: Layers,
};

/* ══════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════ */

interface SubtypeOption {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

interface ChipOption {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface ProjectUIConfig {
  tabLabel: string;
  /** One-line clarifier under the project card label (step 2). */
  tabSub?: string;
  headlinePrefix: string;
  headlineAccent: string;
  headlineSuffix: string;
  twoLineHeadline?: boolean; /* force accent onto a new line (Addition) */
  gridLabel: string;
  subtypes: SubtypeOption[];
  chipsLabel: string;
  chips: ChipOption[];
  footerAccent: string;
}

type SubtypeData = {
  sqft: number;
  refinements: Partial<EstimateRefinements>;
  projectOverride?: ProjectType;
};

/* ══════════════════════════════════════════════════════════════════════
   SUBTYPE DATA  (sqft + refinement seeds, per spec)
══════════════════════════════════════════════════════════════════════ */

const SUBTYPE_DATA: Record<ProjectType, Record<string, SubtypeData>> = {
  /*
   * NEW CONSTRUCTION. The subtype seeds finished area and storeys, which are the
   * two inputs that move a new-build number most, and the sizes are the ones
   * actually built in the Treasure Valley rather than round numbers.
   *
   * Storeys matter more than they look: a two-storey plan puts half its area on
   * the ground, so it shares one foundation and one roof and comes out cheaper
   * per square foot than the same area on a single level. The engine derives that
   * from `stories`, so seeding it here is what makes the difference visible.
   */
  "custom-home": {
    "single-level":    { sqft: 2200, refinements: { stories: 1, garageBays: "three" } },
    "two-story":       { sqft: 2900, refinements: { stories: 2, garageBays: "two" } },
    "main-level-primary": { sqft: 2600, refinements: { stories: 2, garageBays: "three" } },
    "estate":          { sqft: 4200, refinements: { stories: 2, garageBays: "four" } },
  },
  "semi-custom-home": {
    "starter":         { sqft: 1600, refinements: { stories: 1, garageBays: "two" } },
    "family":          { sqft: 2200, refinements: { stories: 2, garageBays: "two" } },
    "single-level":    { sqft: 2000, refinements: { stories: 1, garageBays: "three" } },
    "larger-family":   { sqft: 2900, refinements: { stories: 2, garageBays: "three" } },
  },
  /*
   * BUILD ON YOUR LOT. The cards seed only size and shape. They used to also
   * seed siteDifficulty and lotServices, which meant picking "Acreage" silently
   * priced a well and septic and picking "Foothills" silently tripled the
   * earthwork - assumptions the visitor never saw. Those now come from the site
   * questions (see siteSection), which ask about slope, utilities, water and
   * driveway in plain language and feed the same pricing inputs explicitly.
   */
  "build-on-your-lot": {
    "valley-flat":     { sqft: 2400, refinements: { stories: 1, garageBays: "three" } },
    "acreage":         { sqft: 2600, refinements: { stories: 1, garageBays: "three" } },
    "foothills":       { sqft: 3000, refinements: { stories: 2, garageBays: "three" } },
    "riverfront":      { sqft: 3200, refinements: { stories: 2, garageBays: "three" } },
  },
  /*
   * A shop home is sized by two numbers, not one: the living half on the slider
   * and the shop in a chip. The subtypes seed both, because "1,400 living with a
   * 1,200 shop" is how someone building one describes it, and asking for a
   * single blended figure would make them do arithmetic to answer.
   */
  "shop-home": {
    "compact":         { sqft: 1200, refinements: { stories: 1, garageBays: "none", shopSize: 1200 } },
    "standard":        { sqft: 1700, refinements: { stories: 1, garageBays: "none", shopSize: 1600 } },
    "large-shop":      { sqft: 1600, refinements: { stories: 1, garageBays: "none", shopSize: 2400 } },
    // Site conditions come from the site questions, not the card; see above.
    "family-acreage":  { sqft: 2400, refinements: { stories: 1, garageBays: "two", shopSize: 1800 } },
  },
  kitchen: {
    galley:      { sqft: 175, refinements: { layoutChanges: "none" } },
    "l-shape":   { sqft: 250, refinements: { layoutChanges: "none" } },
    "u-shape":   { sqft: 325, refinements: { layoutChanges: "moderate" } },
    island:      { sqft: 400, refinements: { layoutChanges: "moderate" } },
  },
  bathroom: {
    powder:           { sqft: 50,  refinements: { fixtureCount: 1 } },
    "guest-bath":     { sqft: 80,  refinements: { fixtureCount: 2 } },
    "primary-suite":  { sqft: 120, refinements: { fixtureCount: 3 } },
    "walk-in-shower": { sqft: 90,  refinements: { fixtureCount: 2, layoutChanges: "moderate" } },
  },
  "whole-home": {
    "single-room":   { sqft: 400,  refinements: {} },
    "multi-room":    { sqft: 900,  refinements: {} },
    "whole-home":    { sqft: 1800, refinements: {} },
    "home-addition": { sqft: 500,  refinements: {}, projectOverride: "addition" },
  },
  addition: {
    "bedroom-suite": { sqft: 350, refinements: { plumbingElectrical: "partial" } },
    sunroom:         { sqft: 250, refinements: {} },
    "great-room":    { sqft: 400, refinements: {} },
    "second-story":  { sqft: 600, refinements: { stories: 2 } },
  },
  adu: {
    attached:       { sqft: 500, refinements: { aduConfig: "attached" } },
    garage:         { sqft: 400, refinements: { aduConfig: "attached" } },
    detached:       { sqft: 600, refinements: { aduConfig: "detached" } },
    "above-garage": { sqft: 550, refinements: { aduConfig: "detached" } },
  },
  basement: {
    "family-room":  { sqft: 700, refinements: { layoutChanges: "none" } },
    "home-theater": { sqft: 900, refinements: { layoutChanges: "none" } },
    "guest-suite":  { sqft: 800, refinements: { layoutChanges: "moderate", plumbingElectrical: "partial" } },
    "gym-flex":     { sqft: 700, refinements: { layoutChanges: "none" } },
  },
};

/* The layout whose typical size is closest to the project baseline - used as the
   default selection so a sensible live estimate shows immediately on load. */
function defaultSubtypeFor(project: ProjectType): string {
  const baseline = PROJECT_SIZE_CONFIG[project].baselineSqft;
  const ids = Object.keys(SUBTYPE_DATA[project]);
  return ids.reduce(
    (best, id) =>
      Math.abs(SUBTYPE_DATA[project][id].sqft - baseline) <
      Math.abs(SUBTYPE_DATA[project][best].sqft - baseline)
        ? id
        : best,
    ids[0],
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FOOTER STRIP IMAGES
══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   PROJECT UI CONFIGS
══════════════════════════════════════════════════════════════════════ */

const PROJECT_CONFIGS: Record<ProjectType, ProjectUIConfig> = {
  /*
   * NEW CONSTRUCTION. The chips here are not cosmetic scope like a remodel's
   * "what are you upgrading" - each one is a genuine, separately priced part of
   * the build, wired through buildRefinements to a real engine input. A basement,
   * a third garage bay, covered outdoor living and a well with septic are the
   * four largest optional swings in a Treasure Valley build, so they are asked
   * rather than assumed.
   */
  "custom-home": {
    tabLabel: "Custom Home",
    tabSub: "A one-of-a-kind design",
    headlinePrefix: "Estimate your", headlineAccent: "custom home", headlineSuffix: "build cost",
    gridLabel: "WHAT ARE YOU BUILDING?",
    subtypes: [
      { id: "single-level",        icon: Home,      title: "Single Level",   subtitle: "Everything on one floor" },
      { id: "two-story",           icon: Layers,    title: "Two Story",      subtitle: "Bedrooms upstairs" },
      { id: "main-level-primary",  icon: Bed,       title: "Main-Level Primary", subtitle: "Primary down, rest up" },
      { id: "estate",              icon: Star,      title: "Estate",         subtitle: "4,000 sq ft and up" },
    ],
    chipsLabel: "WHAT ELSE ARE YOU INCLUDING?",
    chips: [
      { id: "basement",       icon: Layers,    label: "BASEMENT" },
      { id: "bigger-garage",  icon: Car,       label: "3+ CAR GARAGE" },
      { id: "covered-patio",  icon: Sun,       label: "COVERED PATIO" },
      { id: "well-septic",    icon: Waves,     label: "WELL + SEPTIC" },
    ],
    footerAccent: "custom home",
  },
  "semi-custom-home": {
    tabLabel: "Semi-Custom",
    tabSub: "Start from our proven plans",
    headlinePrefix: "Estimate your", headlineAccent: "semi-custom home", headlineSuffix: "build cost",
    twoLineHeadline: true,
    gridLabel: "WHICH PLAN SIZE FITS?",
    subtypes: [
      { id: "starter",       icon: Home,       title: "Starter",       subtitle: "About 1,600 sq ft" },
      { id: "single-level",  icon: AlignLeft,  title: "Single Level",  subtitle: "About 2,000 sq ft" },
      { id: "family",        icon: Users,      title: "Family",        subtitle: "About 2,200 sq ft" },
      { id: "larger-family", icon: Layers,     title: "Larger Family", subtitle: "About 2,900 sq ft" },
    ],
    chipsLabel: "WHICH OPTIONS ARE YOU TAKING?",
    chips: [
      { id: "basement",       icon: Layers,    label: "BASEMENT" },
      { id: "bigger-garage",  icon: Car,       label: "3+ CAR GARAGE" },
      { id: "covered-patio",  icon: Sun,       label: "COVERED PATIO" },
      { id: "well-septic",    icon: Waves,     label: "WELL + SEPTIC" },
    ],
    footerAccent: "semi-custom home",
  },
  "build-on-your-lot": {
    tabLabel: "Build on My Lot",
    tabSub: "You already own the land",
    headlinePrefix: "Estimate your build", headlineAccent: "on your own lot", headlineSuffix: "",
    twoLineHeadline: true,
    gridLabel: "WHAT IS YOUR LOT LIKE?",
    subtypes: [
      /* Descriptive only. Subtitles used to hint at pricing ("likely well and
         septic", "Sloped, engineered") that the card silently applied; the site
         questions below now ask those things outright. */
      { id: "valley-flat", icon: Trees,     title: "Flat Valley Lot", subtitle: "In a neighborhood" },
      { id: "acreage",     icon: Warehouse, title: "Acreage",         subtitle: "A larger rural parcel" },
      { id: "foothills",   icon: Mountain,  title: "Foothills",       subtitle: "Up in the hills" },
      { id: "riverfront",  icon: Waves,     title: "River or Creek",  subtitle: "Near the water" },
    ],
    chipsLabel: "WHAT ELSE ARE YOU INCLUDING?",
    /* No well+septic chip here: the site questions ask about water and sewer
       directly on this lot-owned path, and two controls for one input fight. */
    chips: [
      { id: "basement",       icon: Layers,    label: "BASEMENT" },
      { id: "bigger-garage",  icon: Car,       label: "3+ CAR GARAGE" },
      { id: "covered-patio",  icon: Sun,       label: "COVERED PATIO" },
    ],
    footerAccent: "build",
  },
  "shop-home": {
    tabLabel: "Shop Home",
    tabSub: "A home plus a big workshop",
    headlinePrefix: "Price your", headlineAccent: "shop home", headlineSuffix: "build",
    // The slider is living area only. The shop is a separate chip below, because
    // a blended figure hides the ratio that decides the whole budget.
    gridLabel: "HOW MUCH HOUSE, HOW MUCH SHOP?",
    subtypes: [
      { id: "compact",        icon: Warehouse, title: "Compact",     subtitle: "1,200 living, 1,200 shop" },
      { id: "standard",       icon: Home,      title: "Standard",    subtitle: "1,700 living, 1,600 shop" },
      { id: "large-shop",     icon: Car,       title: "Shop-Forward", subtitle: "1,600 living, 2,400 shop" },
      { id: "family-acreage", icon: Trees,     title: "Acreage",     subtitle: "2,400 living, 1,800 shop" },
    ],
    chipsLabel: "WHAT ELSE ARE YOU INCLUDING?",
    /* No well+septic chip: shop homes are a lot-owned path, so the site
       questions ask about water and sewer directly. */
    chips: [
      { id: "bigger-shop",    icon: Warehouse, label: "BIGGER SHOP" },
      { id: "basement",       icon: Layers,    label: "BASEMENT" },
      { id: "covered-patio",  icon: Sun,       label: "COVERED PATIO" },
    ],
    footerAccent: "shop home",
  },
  kitchen: {
    tabLabel: "Kitchen",
    headlinePrefix: "Calculate your", headlineAccent: "kitchen", headlineSuffix: "remodel cost",
    gridLabel: "YOUR KITCHEN LAYOUT",
    subtypes: [
      { id: "galley",   icon: AlignLeft,  title: "Galley",  subtitle: "Two facing runs" },
      { id: "l-shape",  icon: Frame,      title: "L-Shape", subtitle: "Corner run" },
      { id: "u-shape",  icon: Grid3x3,    title: "U-Shape", subtitle: "Three walls" },
      { id: "island",   icon: LayoutGrid, title: "Island",  subtitle: "Open concept" },
    ],
    chipsLabel: "WHAT ARE YOU UPGRADING?",
    chips: [
      { id: "cabinets", icon: LayoutGrid, label: "CABINETS" },
      { id: "counters", icon: Layers,     label: "COUNTERS" },
      { id: "flooring", icon: Grid3x3,    label: "FLOORING" },
      { id: "lighting", icon: Lightbulb,  label: "LIGHTING" },
    ],
    footerAccent: "kitchen",
  },
  bathroom: {
    tabLabel: "Bathroom",
    headlinePrefix: "Calculate your", headlineAccent: "bathroom", headlineSuffix: "remodel cost",
    gridLabel: "YOUR BATHROOM TYPE",
    subtypes: [
      { id: "powder",          icon: Droplets, title: "Powder",         subtitle: "Sink & toilet" },
      { id: "guest-bath",      icon: Layers,   title: "Guest Bath",     subtitle: "Tub & shower" },
      { id: "primary-suite",   icon: Star,     title: "Primary Suite",  subtitle: "Spa retreat" },
      { id: "walk-in-shower",  icon: Wind,     title: "Walk-in Shower", subtitle: "Curbless" },
    ],
    chipsLabel: "WHAT ARE YOU UPGRADING?",
    chips: [
      { id: "shower", icon: Droplets, label: "SHOWER" },
      { id: "vanity", icon: Star,     label: "VANITY" },
      { id: "tub",    icon: Layers,   label: "TUB" },
      { id: "tile",   icon: Grid3x3,  label: "TILE" },
    ],
    footerAccent: "bathroom",
  },
  "whole-home": {
    tabLabel: "Whole-Home",
    headlinePrefix: "Calculate your", headlineAccent: "home", headlineSuffix: "remodel cost",
    gridLabel: "YOUR PROJECT SCOPE",
    subtypes: [
      { id: "single-room",   icon: Layers,    title: "Single Room",   subtitle: "One space" },
      { id: "multi-room",    icon: LayoutGrid, title: "Multi-Room",    subtitle: "A few spaces" },
      { id: "whole-home",    icon: Home,       title: "Whole Home",    subtitle: "Full renovation" },
      { id: "home-addition", icon: Building2,  title: "Home Addition", subtitle: "New footage" },
    ],
    chipsLabel: "WHAT ARE YOU INCLUDING?",
    chips: [
      { id: "kitchen",  icon: UtensilsCrossed, label: "KITCHEN" },
      { id: "baths",    icon: Droplets,        label: "BATHS" },
      { id: "flooring", icon: Grid3x3,         label: "FLOORING" },
      { id: "layout",   icon: LayoutGrid,      label: "LAYOUT" },
    ],
    footerAccent: "home",
  },
  addition: {
    tabLabel: "Addition",
    headlinePrefix: "Calculate your room",
    headlineAccent: "addition",
    headlineSuffix: "cost",
    twoLineHeadline: true, /* "room" ends line 1; "addition cost" is line 2 */
    gridLabel: "WHAT ARE YOU ADDING?",
    subtypes: [
      { id: "bedroom-suite", icon: Bed,    title: "Bedroom Suite", subtitle: "Bed + bath" },
      { id: "sunroom",       icon: Sun,    title: "Sunroom",       subtitle: "Bright + airy" },
      { id: "great-room",    icon: Sofa,   title: "Great Room",    subtitle: "Living space" },
      { id: "second-story",  icon: Layers, title: "Second Story",  subtitle: "Add a level" },
    ],
    chipsLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "foundation", icon: Layers,   label: "FOUNDATION" },
      { id: "framing",    icon: Frame,    label: "FRAMING" },
      { id: "roofing",    icon: Triangle, label: "ROOFING" },
      { id: "hvac",       icon: Wind,     label: "HVAC" },
    ],
    footerAccent: "addition",
  },
  adu: {
    tabLabel: "ADU",
    headlinePrefix: "Calculate your", headlineAccent: "ADU", headlineSuffix: "cost",
    gridLabel: "YOUR ADU TYPE",
    subtypes: [
      { id: "attached",      icon: Home,      title: "Attached",      subtitle: "Shares a wall" },
      { id: "garage",        icon: Car,       title: "Garage",        subtitle: "Convert existing" },
      { id: "detached",      icon: Building2, title: "Detached",      subtitle: "Standalone build" },
      { id: "above-garage",  icon: Layers,    title: "Above Garage",  subtitle: "Second story" },
    ],
    chipsLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "kitchen",  icon: UtensilsCrossed, label: "KITCHEN" },
      { id: "bath",     icon: Droplets,        label: "BATH" },
      { id: "bedroom",  icon: Bed,             label: "BEDROOM" },
      { id: "living",   icon: Sofa,            label: "LIVING" },
    ],
    footerAccent: "ADU",
  },
  basement: {
    tabLabel: "Basement",
    headlinePrefix: "Calculate your", headlineAccent: "basement", headlineSuffix: "finishing cost",
    gridLabel: "HOW WILL YOU USE IT?",
    subtypes: [
      { id: "family-room",  icon: Sofa,    title: "Family Room",  subtitle: "Living space" },
      { id: "home-theater", icon: Monitor, title: "Home Theater", subtitle: "Media room" },
      { id: "guest-suite",  icon: Bed,     title: "Guest Suite",  subtitle: "Bed + bath" },
      { id: "gym-flex",     icon: Dumbbell,title: "Gym / Flex",   subtitle: "Workout space" },
    ],
    chipsLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "egress",   icon: DoorOpen,   label: "EGRESS" },
      { id: "bath",     icon: Droplets,   label: "BATH" },
      { id: "wet-bar",  icon: GlassWater, label: "WET BAR" },
      { id: "flooring", icon: Grid3x3,    label: "FLOORING" },
    ],
    footerAccent: "basement",
  },
};


/*
 * THE LIST A VISITOR SEES, and the reason the remodel project types are still
 * defined but absent here.
 *
 * Boise Construction Co builds new homes. The remodel types remain in the engine
 * because the market-ceiling guard for new construction is derived from them and
 * because they carry a large calibrated invariant suite worth keeping, but
 * offering a kitchen remodel on a home builder's estimator would misrepresent
 * what the company does. Add a type here only when it is genuinely for sale.
 */
const PROJECT_TYPE_ORDER: ProjectType[] = [
  /* "Build on My Lot" is deliberately absent: owning land is a situation, not
     a kind of home, so it is asked as its own early question. A landowner who
     picks "Custom Home" is priced through the build-on-your-lot rule set via
     resolveProjectType below, so the grid shows only genuine home types while
     the quoted range stays exactly what the old BOL card produced. */
  "custom-home", "semi-custom-home", "shop-home",
];

/** The card a given internal project type belongs to on the grid. */
function cardTypeOf(p: ProjectType): ProjectType {
  return p === "build-on-your-lot" ? "custom-home" : p;
}

/** Land ownership + tapped card -> the internal project type the engine prices. */
function resolveProjectType(
  card: ProjectType,
  ownership: "own" | "not-yet" | null,
): ProjectType {
  return ownership === "own" && card === "custom-home" ? "build-on-your-lot" : card;
}

/** The project the estimator opens on. */
const DEFAULT_PROJECT: ProjectType = "custom-home";

/* ══════════════════════════════════════════════════════════════════════
   REFINEMENT BUILDER  (exact logic per spec)
══════════════════════════════════════════════════════════════════════ */

/**
 * Assembles the engine refinements from what the visitor actually told us.
 *
 * The upgrade chips used to silently drive pricing: ticking a fourth chip set
 * plumbing and electrical to "full", so adding "Flooring" (which has nothing to
 * do with plumbing) quietly moved a kitchen from $53k-$66k to $57k-$72k and
 * printed "Full (complete update)" in the customer's confirmation email for a
 * scope they never chose. Inferring a systems scope from a checkbox count is
 * not defensible, so it is now asked directly and the chips only capture scope.
 *
 * The one inference kept is the whole-home "Layout" chip, because that chip
 * literally says layout: ticking it is a direct statement, not a guess.
 */
/**
 * A typed "about how big" square footage, or null when blank or nonsense.
 * Clamped because every one of these multiplies a rate in the takeoff, so a
 * stray extra zero must widen the range plausibly rather than absurdly.
 */
function parseApproxSqft(raw: string, min: number, max: number): number | null {
  const n = Number(raw.replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function buildRefinements(
  effectiveProject: ProjectType,
  _subtype: string,
  addOns: string[],
  subtypeRef: Partial<EstimateRefinements>,
  plumbingElectrical: PlumbingElectrical | null,
  cabinetTier: CabinetTier | null,
  bathroomCount: number | null,
  kitchenIncluded: boolean | null,
  /* Whether the visitor already owns the land. When they do, the site
     questions (asked on every owned-land path, whatever the home type) are
     the authority on water and sewer, so the chip must not fight them. */
  ownsLand: boolean,
): EstimateRefinements {
  const ref: EstimateRefinements = { ...EMPTY_REFINEMENTS, ...subtypeRef };

  /*
   * NEW CONSTRUCTION CHIPS ARE PRICED, not decorative.
   *
   * Each maps to an input the line-item engine reads, so ticking one visibly
   * moves the number. That is the whole point: the memory note on this codebase
   * records that a selection wired only into the guide engine silently does
   * nothing to the quoted range, and a chip that changes no number is worse than
   * no chip at all because it teaches people the estimator is decorative.
   *
   * Note these OVERRIDE the subtype seed rather than merging with it, so a
   * visitor who picks the acreage lot preset and then unticks "well and septic"
   * gets a price without it.
   */
  if (isNewConstructionProject(effectiveProject)) {
    if (addOns.includes("basement")) ref.basementType = "unfinished";
    // The subtype seeds two or three bays; the chip is what takes it to three or
    // more, and never reduces what the preset already implied.
    if (addOns.includes("bigger-garage")) {
      ref.garageBays = ref.garageBays === "four" ? "four" : "three";
    } else if (ref.garageBays === "three" || ref.garageBays === "four") {
      ref.garageBays = "two";
    }
    ref.coveredOutdoor = addOns.includes("covered-patio") ? 300 : 0;
    /* Owned-land paths ask about water and sewer in the site questions instead
       of a chip, and those answers are merged after this function runs. For
       the other new-build paths the chip remains the authority. */
    if (ownsLand) {
      ref.lotServices = null;
    } else {
      ref.lotServices = addOns.includes("well-septic") ? "well-septic" : "city";
    }
  }

  if (effectiveProject === "shop-home") {
    // Every shop home has a shop, so this floors at the preset rather than at
    // zero. The chip enlarges it; unticking returns it to what the subtype
    // implied instead of removing the shop, which would make it a house.
    const preset = subtypeRef.shopSize ?? 1600;
    ref.shopSize = addOns.includes("bigger-shop") ? Math.round(preset * 1.5) : preset;
  }

  if (effectiveProject === "whole-home" && addOns.includes("layout")) {
    ref.layoutChanges = "moderate";
  }

  if (plumbingElectrical) ref.plumbingElectrical = plumbingElectrical;
  if (cabinetTier && effectiveProject === "kitchen") ref.cabinetTier = cabinetTier;

  if (bathroomCount !== null) ref.bathroomCount = bathroomCount;
  if (kitchenIncluded !== null) ref.kitchenIncluded = kitchenIncluded;

  // Kitchen and bathroom "what are you upgrading" chips scope the estimate: a
  // partial subset prices below a full remodel. Only pass them for those two
  // projects; other projects' chips describe inherent build components, not
  // optional finish scope, and must not scope the price.
  if (effectiveProject === "kitchen" || effectiveProject === "bathroom") {
    ref.upgradeScope = addOns.length > 0 ? [...addOns] : null;
  }

  return ref;
}

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════ */

/**
 * @deprecated Use `finishLabels` from getFinishLabels(activeProject) instead, so
 * a new home shows "Signature" rather than the remodeling word "Mid-Range".
 * Retained only until the last remaining reference is migrated.
 */
const FINISH_LABELS: Record<FinishLevel, string> = {
  refresh: "Refresh",
  "mid-range": "Mid-Range",
  "high-end": "High-End",
  luxury: "Luxury",
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */

interface EstimateCalculatorProps {
  inModal?: boolean;
  onBookVisit?: () => void;
}

export function EstimateCalculator({
  inModal = false,
  onBookVisit: onBookVisitProp,
}: EstimateCalculatorProps = {}) {

  /* ── State ── */
  const [activeProject, setActiveProject] = useState<ProjectType>(DEFAULT_PROJECT);
  const [subtype, setSubtype]             = useState<string>(() => defaultSubtypeFor(DEFAULT_PROJECT));
  const [sqft, setSqft]                   = useState<number>(
    () => SUBTYPE_DATA[DEFAULT_PROJECT][defaultSubtypeFor(DEFAULT_PROJECT)].sqft,
  );
  const [addOns, setAddOns]               = useState<string[]>([]);
  /*
   * SITE QUESTIONS, lot-owned paths only (Build on My Lot, Shop Home).
   *
   * These used to be inferred from the lot-type card ("Acreage" silently
   * priced a well and septic, "Foothills" silently tripled the earthwork).
   * They are now asked outright in plain language and feed the same pricing
   * inputs. null means "not answered", and "unsure"/null price the
   * inexpensive case for the same reason resolve.ts treats unknown services
   * as city: quoting a well to someone who does not need one loses the lead.
   */
  const [siteSlope, setSiteSlope]         = useState<"flat" | "moderate" | "steep" | "unsure" | null>(null);
  const [siteWater, setSiteWater]         = useState<"city" | "well-septic" | "unsure" | null>(null);
  const [siteUtilities, setSiteUtilities] = useState<"yes" | "no" | "unsure" | null>(null);
  const [siteDriveway, setSiteDriveway]   = useState<"short" | "medium" | "long" | "unsure" | null>(null);
  /*
   * SIZE FINE-TUNING, new-construction paths.
   *
   * Garage bays used to be settled silently by the layout preset and the
   * "3+ car garage" chip, the basement was silently assumed to match the
   * ground-floor footprint, and the patio was silently 300 SF. These let the
   * visitor state what they actually want; null / "" means "not stated" and
   * keeps the previous assumption, so nothing moves until they type or tap.
   */
  const [garageBaysChoice, setGarageBaysChoice] = useState<"two" | "three" | "four" | null>(null);
  const [garageSqftInput, setGarageSqftInput]   = useState<string>("");
  const [basementSize, setBasementSize]         = useState<"full" | "partial">("full");
  const [basementSqftInput, setBasementSqftInput] = useState<string>("");
  const [patioSqftInput, setPatioSqftInput]     = useState<string>("");
  const [finish, setFinish]               = useState<FinishLevel>("mid-range");
  const [budgetInput, setBudgetInput]     = useState<string>("");
  /* Nothing is pre-selected for the visitor. The state above still holds
     working values so the engine always has a valid input, but until the
     visitor makes each choice themselves nothing is shown as selected, the
     later steps stay hidden, and no estimate can be produced. Presenting a
     pre-filled answer invites people to accept a project they never chose. */
  /* Systems scope and cabinetry tier are asked outright rather than inferred
     from the upgrade chips, so nothing reaches the estimate or the email that
     the visitor did not choose. */
  const [peScope, setPeScope] = useState<PlumbingElectrical | null>(null);
  const [cabTier, setCabTier] = useState<CabinetTier | null>(null);
  /* Whole-home only. Bathrooms are the largest swing in a whole-home budget and
     were never asked; the kitchen is the second largest. Both are priced as
     modules against what the published rate already assumes. */
  const [bathCount, setBathCount] = useState<number | null>(null);
  /* Tracks whether the visitor explicitly tapped a bath-count button.
     Pre-filling bathCount from property data should NOT count as confirmed --
     the user must see and accept (or change) it before the finish scroll fires. */
  const [bathCountConfirmed, setBathCountConfirmed] = useState(false);
  const [kitchenIn, setKitchenIn] = useState<boolean | null>(null);
  /* True once the visitor overrides a pre-selected value, after which the
     profile stops overwriting their choice. */
  const [edited, setEdited] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chosen, setChosen] = useState({
    stage: false,
    land: false,
    project: false,
    subtype: false,
    finish: false,
  });

  /*
   * THE FIRST QUESTION, and the reason it is not "what are you building".
   *
   * Every home here is drawn from scratch, so opening with a product grid or
   * with the lot asks the visitor to classify themselves against a distinction
   * the company does not actually make. What genuinely differs between two
   * enquiries is how much is already decided, and that is what a builder asks
   * first on the phone. It also decides how honest the range can be: see
   * PLANNING_STAGE_BAND.
   */
  const [planningStage, setPlanningStage] = useState<PlanningStage | null>(null);

  /*
   * LAND OWNERSHIP, asked as its own early question rather than inferred from
   * a "Build on My Lot" project card. Owning the lot is a situation, not a
   * kind of home: it decides whether the street address and property lookup
   * make sense to ask, whether the site questions apply, and which pricing
   * rule set a custom home runs through (see resolveProjectType).
   */
  const [landOwnership, setLandOwnership] = useState<"own" | "not-yet" | null>(null);
  /* Where a non-landowner plans to build. A city or area name -- never a
     street address for land they do not own. */
  const [buildArea, setBuildArea] = useState("");

  /*
   * Additional buildings. null until the question has been shown, so "not asked"
   * and "asked, none wanted" stay distinguishable in the lead record; both price
   * as none.
   */
  const [structures, setStructures] = useState<AccessoryStructure[] | null>(null);
  /** Which structure's follow-up questions are expanded. */
  const [openStructure, setOpenStructure] = useState<AccessoryStructureKind | null>(null);

  /*
   * PLAN UPLOAD, offered only to the two stages that have drawings.
   *
   * `planStored` is kept even when extraction fails, because the files are
   * filed against the lead either way and the team wants the drawings whatever
   * the model made of them. `planApplied` is what the visitor is shown: a form
   * that silently rewrites six of its own answers while they watch is alarming
   * even when every new value is correct.
   */
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planApplied, setPlanApplied] = useState<string[] | null>(null);
  /** Scope the plans revealed that is shown back but does not move the range. */
  const [planUnderstood, setPlanUnderstood] = useState<string[]>([]);
  const [planUnresolved, setPlanUnresolved] = useState<string[]>([]);
  const [planStored, setPlanStored] = useState<{ filename: string; url: string }[]>([]);
  const [planIsRemodel, setPlanIsRemodel] = useState(false);
  /* Answers the plans overwrote AFTER the visitor had already given them. A
     value silently changing under someone is alarming; each rewrite is stated
     back so nothing moves without being called out. */
  const [planChanged, setPlanChanged] = useState<string[]>([]);
  /* Which questions the drawings answered. Those steps collapse into a
     one-line "from your plans" summary with an Edit affordance rather than
     re-asking; editing clears the mark and hands authority back to the
     visitor. */
  const [planFilled, setPlanFilled] = useState<{
    size?: boolean;
    baths?: boolean;
    structures?: boolean;
  }>({});
  /* The size as read off the drawings, before any project clamp. The upload
     now happens before a project is chosen, so clamping at upload time would
     bake the DEFAULT project's bounds into the number and a later project
     choice could never recover the real figure (a 900 SF shop-home plan would
     become 1,200 SF forever). The raw reading is kept here and re-clamped to
     the actual project's range each time one is picked. */
  const planSqftRaw = useRef<number | null>(null);
  /**
   * Refinements the drawings settled, applied over the subtype seed.
   *
   * Storeys, garage bays, covered outdoor area and basement type have no state
   * of their own - they are implied by the layout card and the add-on chips - so
   * a plan reading cannot simply call a setter. They are held here and merged
   * last, which means they outrank the subtype seed, which is correct: a fact
   * read off the visitor's own drawings should beat the layout card's guess.
   *
   * Because they merge last they would also outrank the CHIPS, which is not
   * correct, so handleToggleChip drops the matching override when one is tapped.
   * See CHIP_SUPERSEDES.
   */
  const [planOverrides, setPlanOverrides] = useState<Partial<EstimateRefinements>>({});
  /* Bathroom count and kitchen inclusion are REQUIRED wherever they are shown.
     Leaving them optional meant a skipped answer silently priced at whatever
     the published rate happens to assume, which is an assumption made on the
     homeowner's behalf about the single largest swing in the estimate. Asked
     and answered, never inferred. Declared after the visibility flags below. */
  const [scopeOpen, setScopeOpen]         = useState(false);
  const [takeoffOpen, setTakeoffOpen]     = useState(false);
  /*
   * Real unit costs recorded in the admin pricing panel. The estimator runs in
   * the browser and cannot read the database, so without this the homeowner
   * would see derived allocations while the confirmation email and the CRM
   * show measured costs. Fetched once; an empty map simply means every line is
   * still a derived allocation, which is the correct fallback.
   */
  const [unitCostOverrides, setUnitCostOverrides] = useState<UnitCostOverrides>({});
  const [legalOpen, setLegalOpen]         = useState(false);
  const [limitsOpen, setLimitsOpen]       = useState(false);
  /* Lead-gate three-state flow:
     gateOpen=false  gateSubmitted=false -> show "Get estimate" CTA
     gateOpen=true   gateSubmitted=false -> show contact form (gate)
     gateSubmitted=true (any gateOpen)   -> show full result panel */
  const [gateOpen,      setGateOpen]      = useState(false);
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [gateName,      setGateName]      = useState("");
  const [gateEmail,     setGateEmail]     = useState("");
  const [gatePhone,     setGatePhone]     = useState("");
  const [gateLoading,   setGateLoading]   = useState(false);
  const [gateError,     setGateError]     = useState<string | null>(null);
  /* Property address. Collected here as well as on the consultation form: this
     gate is the path most leads arrive through, and without it the team cannot
     confirm the property is inside the service area, and the county property
     lookup that prepares the visit has nothing to work from. */
  const [gateAddress,   setGateAddress]   = useState("");
  const [gateProfile,   setGateProfile]   = useState<PropertyProfile | null>(null);
  /* Contact details we already hold for this visitor. Present means they have
     passed the gate before (possibly on an earlier visit), so the estimator is
     theirs to use freely: no re-entry, editable, and resubmittable. */
  const [savedIdentity, setSavedIdentity] = useState<{ name: string; email: string; phone: string } | null>(null);
  /* Signature of the estimate last sent to the team, so we can tell whether
     what is on screen now is actually new information worth resubmitting. */
  const [lastSentKey, setLastSentKey] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  /* Guards the estimator-completion conversion event so it fires at most once
     per mount even if the visitor recalculates after editing. */
  const engagementFired   = useRef(false);
  /* Scroll refs - each targets the top of the section that appears when the
     visitor completes a step. scheduleScroll() uses double-rAF so the DOM
     is fully painted before the browser scrolls. Instant on mobile (iOS
     smooth-scroll is unreliable); smooth on desktop. */
  const projectGridRef = useRef<HTMLDivElement>(null);
  const landStepRef    = useRef<HTMLDivElement>(null);
  const structuresRef  = useRef<HTMLDivElement>(null);
  const planUploadRef  = useRef<HTMLDivElement>(null);
  const addressStepRef = useRef<HTMLDivElement>(null);
  const layoutRef      = useRef<HTMLDivElement>(null);
  const sizeRef        = useRef<HTMLDivElement>(null);
  const chipsRef       = useRef<HTMLDivElement>(null);
  const bathRef        = useRef<HTMLDivElement>(null);
  const kitchenRef     = useRef<HTMLDivElement>(null);
  const finishRef      = useRef<HTMLDivElement>(null);
  const typicalRef     = useRef<HTMLDivElement>(null);
  const ctaAreaRef     = useRef<HTMLDivElement>(null);
  const gateFormRef    = useRef<HTMLDivElement>(null);
  const resultRef      = useRef<HTMLDivElement>(null);
  const sectionRef     = useRef<HTMLDivElement>(null);
  const allChosenScrolled  = useRef(false);
  const pendingScrollTarget = useRef<(() => HTMLElement | null) | null>(null);

  /* Auto-scroll runs on every viewport. As each step completes the page
     advances to the next section so the visitor is not left hunting for what
     appeared below the fold. The position is computed manually (not
     scrollIntoView) so the step heading always lands just below the sticky
     site header: we measure the real header height at scroll time, which holds
     on iOS Safari where fixed offsets are unreliable.

     Behaviour differs only in feel: instant on mobile, where iOS smooth-scroll
     is janky and a moving page under a thumb is disorienting, and smooth on
     desktop, where a gentle glide reads as guidance rather than a jump. A user
     who prefers no motion (prefers-reduced-motion) gets instant everywhere. */
  function scrollToStep(el: HTMLElement | null) {
    if (!el || typeof window === "undefined") return;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 64;
    /* Do not move the page when the target is already comfortably in view:
       a scroll that lands where the visitor already is reads as a jump for
       nothing, and on mobile (instant behaviour) it is disorienting. "In
       view" means the heading sits below the sticky header and in the top
       ~55% of the viewport, so the section's content is visible too. */
    const rect = el.getBoundingClientRect();
    if (rect.top >= headerH + 8 && rect.top <= window.innerHeight * 0.55) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    const isDesktop = window.innerWidth >= 768;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const behavior: ScrollBehavior =
      isDesktop && !prefersReducedMotion ? "smooth" : "instant";
    window.scrollTo({ top: Math.max(0, top), behavior });
  }
  /* Coalesces all scrolls requested in the same frame into exactly ONE scroll.
     The FIRST requested target wins: effects for earlier steps schedule first,
     so a race can only ever resolve to the earliest (next) step in sequence --
     it can never skip ahead past a step the visitor still needs to complete. */
  function scheduleScroll(getEl: () => HTMLElement | null): boolean {
    if (pendingScrollTarget.current !== null) return false;
    pendingScrollTarget.current = getEl;

    // Fire exactly once, whichever timer wins. The double-rAF path waits for
    // the new section to paint before measuring, which is what keeps the step
    // heading landing in the right place. But rAF is throttled or suspended in
    // background tabs and under load on some mobile browsers, and if it never
    // fired the scroll would silently fail AND leave pendingScrollTarget stuck,
    // disabling every later scroll. The setTimeout is the floor: it guarantees
    // the scroll runs and the sentinel clears even when rAF does not.
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      const getTarget = pendingScrollTarget.current;
      pendingScrollTarget.current = null;
      if (getTarget) scrollToStep(getTarget());
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
    // 80ms comfortably clears a normal two-frame paint (~32ms), so on a healthy
    // browser rAF still wins and this never runs; it only takes over when rAF
    // is being throttled.
    setTimeout(run, 80);
    return true;
  }

  /* ── Derived ── */
  const config = PROJECT_CONFIGS[activeProject];

  /* Finish tier names depend on the project: a new home is specified
     "Essential" to "Bespoke", not "Refresh" to "Luxury". */
  const finishLabels = getFinishLabels(activeProject);
  const isNewBuild = isNewConstructionProject(activeProject);

  const effectiveProject = useMemo<ProjectType>(
    () => SUBTYPE_DATA[activeProject]?.[subtype]?.projectOverride ?? activeProject,
    [activeProject, subtype],
  );

  /* Land ownership gates the address step, the site questions and which
     pricing rules a custom home runs through. Every rule set prices the site
     inputs (they share siteAndOverheadRules), so gating on ownership rather
     than on project type is safe and correct. */
  const ownsLand = landOwnership === "own";

  /* Finish options MUST come from effectiveProject to stay consistent with the engine */
  const availFinish = useMemo(
    () => getAvailableFinishLevels(effectiveProject),
    [effectiveProject],
  );

  /* When effectiveProject changes (subtype override), drop invalid finish selection */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/pricing/unit-costs")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.overrides && typeof body.overrides === "object") {
          setUnitCostOverrides(body.overrides as UnitCostOverrides);
        }
      })
      .catch(() => {
        // Pricing must never be the reason the estimator fails to render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!availFinish.includes(finish)) setFinish("mid-range");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availFinish]);

  /* Size config (min / max / step / baseline) for the sqft slider, per project. */
  const sizeConfig = PROJECT_SIZE_CONFIG[effectiveProject];

  const refinements = useMemo<EstimateRefinements>(() => {
    const data = SUBTYPE_DATA[activeProject]?.[subtype];
    const base = data
      ? buildRefinements(effectiveProject, subtype, addOns, data.refinements, peScope, cabTier, bathCount, kitchenIn, ownsLand)
      : { ...EMPTY_REFINEMENTS };
    /* Plan overrides land on top of the subtype seed but BELOW nothing else:
       they are facts read off the visitor's own drawings, so they outrank the
       layout card's assumptions. Undefined keys are stripped first so an
       override that the plans did not settle cannot blank a seeded value. */
    const overrides = Object.fromEntries(
      Object.entries(planOverrides).filter(([, v]) => v !== undefined),
    );
    /* Attached to every estimate, including the incomplete one, so the band and
       the structure pricing follow the visitor's answers rather than lagging a
       step behind them. */
    const merged: EstimateRefinements = {
      ...base,
      ...overrides,
      planningStage,
      accessoryStructures: structures,
    };
    /* Site answers land LAST on lot-owned paths: they are the visitor's own
       statement about their land, so they outrank both the layout card and
       anything read off drawings (plans do not know the lot). Unanswered
       questions stay null and price the simple/city case. */
    /* Size fine-tuning lands LAST on new-build paths: an explicitly picked bay
       count or typed square footage is the visitor's own statement, so it
       outranks the layout preset, the chips, and anything read off drawings.
       Untouched controls contribute null and change nothing. */
    if (isNewConstructionProject(effectiveProject)) {
      if (garageBaysChoice) merged.garageBays = garageBaysChoice;
      merged.garageSqft =
        merged.garageBays && merged.garageBays !== "none"
          ? parseApproxSqft(garageSqftInput, 100, 2400)
          : null;
      /* "Partial" must always price as partial: with no size typed yet it
         defaults to half the ground-floor footprint (disclosed in the input's
         placeholder and the assumptions list), so the tap itself moves the
         range instead of silently falling back to the full-footprint preset. */
      const footprintSf = Math.round(sqft / Math.max(1, Math.round(merged.stories ?? 1)));
      merged.basementSqft =
        merged.basementType && merged.basementType !== "none" && basementSize === "partial"
          ? (parseApproxSqft(basementSqftInput, 100, 6000) ?? Math.max(100, Math.round(footprintSf / 2)))
          : null;
      if (merged.coveredOutdoor && merged.coveredOutdoor > 0) {
        const patio = parseApproxSqft(patioSqftInput, 50, 4000);
        if (patio !== null) merged.coveredOutdoor = patio;
      }
    }
    if (ownsLand && isNewConstructionProject(effectiveProject)) {
      merged.siteDifficulty =
        siteSlope === "flat" ? "simple"
        : siteSlope === "moderate" ? "moderate"
        : siteSlope === "steep" ? "steep"
        : null;
      merged.lotServices = siteWater;
      merged.utilitiesAtLot =
        siteUtilities === "yes" ? true : siteUtilities === "no" ? false : null;
      merged.drivewayLength =
        siteDriveway === "short" ? 40
        : siteDriveway === "medium" ? 120
        : siteDriveway === "long" ? 350
        : null;
    }
    return merged;
  }, [
    effectiveProject, activeProject, subtype, addOns, peScope, cabTier, bathCount, kitchenIn,
    ownsLand, planningStage, structures, planOverrides,
    siteSlope, siteWater, siteUtilities, siteDriveway,
    garageBaysChoice, garageSqftInput, basementSize, basementSqftInput, patioSqftInput,
    sqft,
  ]);

  const userRefinementCount = useMemo(
    () => countVisibleUserRefinements(effectiveProject, getSetRefinementKeys(refinements)),
    [effectiveProject, refinements],
  );

  /**
   * The quoted range now comes from the line-item cost engine.
   *
   * calculateEstimate still runs and still supplies everything that is not the
   * price - ROI, the typical-inclusions list, the confidence label - and it
   * remains the source of the market ceiling the cost engine's margin guard
   * prices against. Only priceLow and priceHigh are replaced, so every consumer
   * downstream (session storage, both emails, the CRM record) keeps working
   * against the same shape it always had.
   */
  /**
   * The homeowner's stated budget, compared against the range they can already
   * see. Kept as raw text so a typed "45,000" or "45000" both work and nothing
   * is reformatted under the cursor while they type.
   */
  const budgetValue = useMemo(() => {
    const n = Number(budgetInput.replace(/[^\d]/g, ""));
    // Below a few thousand it is a mistyped number, not a budget, and quoting
    // "unlikely to land near $45" back at someone is worse than saying nothing.
    return Number.isFinite(n) && n >= 3000 ? n : null;
  }, [budgetInput]);

  const result = useMemo<EstimateResult>(() => {
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    const guide = calculateEstimate(input, userRefinementCount);

    const maxFields = getMaxRefinementFields(effectiveProject);
    const detailRatio = maxFields > 0 ? userRefinementCount / maxFields : 0;
    const range = resolveQuotedRange(effectiveProject, finish, sqft, refinements, detailRatio);
    return range ? { ...guide, ...range } : guide;
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

  /**
   * Declared AFTER `result` on purpose: the comparison must follow the range
   * the homeowner is looking at, never a stale copy of it.
   */
  const budgetAssessment = useMemo(() => {
    if (budgetValue === null) return null;
    const internal = resolveInternalEstimate(effectiveProject, finish, sqft, refinements);
    const topTrades = internal ? internal.admin.trades.slice(0, 2).map((t) => t.division) : [];
    return assessBudget(
      effectiveProject,
      { quality: finish as QualityLevel, sqft, ...refinements } as unknown as ScopeSelections,
      { low: result.priceLow, high: result.priceHigh },
      budgetValue,
      topTrades,
    );
  }, [budgetValue, effectiveProject, finish, sqft, refinements, result.priceLow, result.priceHigh]);

  /* The visitor's literal card/chip choices, resolved to the exact labels shown
     on screen so the emails can restate them word for word. */
  const selectedLayoutLabel = useMemo(
    () =>
      chosen.subtype
        ? PROJECT_CONFIGS[activeProject].subtypes.find((s) => s.id === subtype)?.title
        : undefined,
    [chosen.subtype, activeProject, subtype],
  );

  const selectedUpgradeLabels = useMemo(() => {
    const chips = PROJECT_CONFIGS[activeProject].chips;
    return addOns
      .map((id) => chips.find((c) => c.id === id)?.label)
      .filter((l): l is string => !!l)
      // Chips render uppercase for the grid; title-case reads better in email.
      .map((l) => l.charAt(0) + l.slice(1).toLowerCase());
  }, [activeProject, addOns]);

  /* Exclusions, assumptions and cost drivers, from the same shared source the
     confirmation emails use, so the on-screen and emailed estimate never differ. */
  const disclosure = useMemo(
    () =>
      buildEstimateDisclosure({ project: effectiveProject, finish, sqft, refinements }),
    [effectiveProject, finish, sqft, refinements],
  );

  /* On mount: prefill the gate for pre-qualified traffic (e.g. a Meta Instant
     Form click that already captured their info) so it's a single tap, then
     restore gate state for return visits. We never skip the gate: contact is
     always captured on-site before the range is revealed. */
  useEffect(() => {
    const { prefill } = applyLeadParams();
    if (prefill.name) setGateName(prefill.name);
    if (prefill.email) setGateEmail(prefill.email);
    if (prefill.phone) setGatePhone(prefill.phone);
    // A visitor who already gave us their details should never be asked again,
    // including on a later visit, so this reads durable storage and restores
    // both the gate state AND the saved contact info (needed to resubmit an
    // updated estimate without retyping anything).
    const saved = readStoredPrefill();
    if (saved.name) setGateName(saved.name);
    if (saved.email) setGateEmail(saved.email);
    if (saved.phone) setGatePhone(saved.phone);
    if (saved.address) setGateAddress(saved.address);
    if (hasPassedGate()) {
      setGateSubmitted(true);
      setSavedIdentity({
        name: saved.name ?? "",
        email: saved.email ?? "",
        phone: saved.phone ?? "",
      });
      setLastSentKey(readLastSentKey());
    }
  }, []);

  /* The budget deliberately survives a change of project type. It used to be
     cleared here because the brackets offered were per-project, so a kitchen
     bracket was meaningless once you switched to a bathroom. A plain number is
     not: what someone has to spend does not change because they clicked a
     different tab, and wiping it would silently drop the answer they gave. */

  /* ── Handlers ── */

  /* Estimator engagement is UPPER FUNNEL, not the primary conversion. The goal
     is: get an estimate on the site, then submit the consultation form - that
     submission is the Lead (fired with email/phone in ConsultationForm). This
     fires once per session on first real interaction or when a visit is booked,
     as InitiateCheckout / begin_checkout: it feeds a retargeting audience of
     people who started an estimate but have not submitted, and gives Meta higher
     early volume to optimize toward the real Lead. Not counted as a Lead, so no
     double-counting. */
  function fireEstimatorEngagement() {
    if (engagementFired.current) return;
    engagementFired.current = true;
    trackMetaEvent("InitiateCheckout", {
      content_name: effectiveProject,
      content_category: "new_construction_estimate",
    });
    trackEvent("begin_checkout", { project: effectiveProject });
  }

  function handleSelectStage(stage: PlanningStage) {
    setPlanningStage(stage);
    setChosen((p) => ({ ...p, stage: true }));
    fireEstimatorEngagement();
    /* A visitor with drawings goes straight to the upload -- that is the whole
       point of asking the stage first. Everyone else advances to the land
       question, which now precedes the project grid. */
    const hasDrawings = stage === "have-plans" || stage === "plans-in-progress";
    scheduleScroll(() => (hasDrawings ? planUploadRef.current : landStepRef.current));
  }

  /**
   * The land-ownership answer. Asked before the project because it reshapes
   * what follows: owners get the street address + property lookup and the
   * site questions; everyone else gets a light "where do you plan to build"
   * question and no site interrogation about land they do not have.
   *
   * If a project is already chosen, changing the answer re-resolves the
   * internal project type (own + Custom Home prices through the
   * build-on-your-lot rule set) via the same full reset a fresh card tap runs,
   * so subtype seeds, chips and finish options can never describe the old path.
   */
  function handleSelectLand(v: "own" | "not-yet") {
    const changed = landOwnership !== v;
    setLandOwnership(v);
    setChosen((p) => ({ ...p, land: true }));
    /* When land is owned the site questions are the authority on water and
       sewer, and the chip is hidden -- a ticked one must not keep pricing. */
    if (v === "own") setAddOns((prev) => prev.filter((c) => c !== "well-septic"));
    /* Flipping away from ownership must forget the property: a street address
       and county profile describe land the visitor just said they do not own,
       and leaving them in state would silently attach an unrelated property
       to the lead payload. */
    if (v !== "own") {
      setGateAddress("");
      setGateProfile(null);
    }
    fireEstimatorEngagement();
    if (chosen.project && changed) {
      const resolved = resolveProjectType(cardTypeOf(activeProject), v);
      if (resolved !== activeProject) {
        applyProjectSelection(resolved);
        return;
      }
    }
    scheduleScroll(() => projectGridRef.current);
  }

  /** Tick or untick a structure, keeping the per-structure detail on re-tick. */
  function toggleStructure(kind: AccessoryStructureKind) {
    setStructures((prev) => {
      const list = prev ?? [];
      const existing = list.find((s) => s.kind === kind);
      if (existing) {
        setOpenStructure((o) => (o === kind ? null : o));
        return list.filter((s) => s.kind !== kind);
      }
      setOpenStructure(kind);
      return [...list, defaultAccessoryStructure(kind)];
    });
    setPlanFilled((p) => (p.structures ? { ...p, structures: false } : p));
    setEdited(true);
  }

  function updateStructure(kind: AccessoryStructureKind, patch: Partial<AccessoryStructure>) {
    setStructures((prev) =>
      (prev ?? []).map((s) => (s.kind === kind ? { ...s, ...patch } : s)),
    );
    setEdited(true);
  }

  /**
   * Send the drawings up, then apply whatever they settled.
   *
   * Nothing here overwrites a value the visitor set unless the plans actually
   * state it: applyPlanToEstimate returns only the fields the drawings
   * answered, and every key is checked for undefined before it is used. A
   * schematic set that states no areas leaves the form exactly as it was.
   */
  async function handlePlanUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setPlanBusy(true);
    setPlanError(null);
    setPlanApplied(null);
    setPlanUnderstood([]);
    setPlanUnresolved([]);
    setPlanIsRemodel(false);

    const body = new FormData();
    for (const f of Array.from(fileList)) body.append("files", f);

    try {
      const res = await fetch("/api/plans/analyze", { method: "POST", body });
      const data = await res.json();

      // Files are stored before analysis, so a failed read still leaves the
      // team holding the drawings. Record them whatever the status was.
      if (Array.isArray(data.stored)) setPlanStored(data.stored);

      if (!res.ok) {
        setPlanError(data.message ?? "We could not read that plan set.");
        return;
      }

      const plan = data.plan as ExtractedPlan;

      /* A remodel set read as a new build would price an entire house the
         client never asked for, so this stops rather than applying anything. */
      if (!plan.isNewConstruction) {
        setPlanIsRemodel(true);
        setPlanError(
          "Those drawings look like a remodel or addition rather than a new home, so we have not changed your answers. We have kept the files and can price that work separately.",
        );
        return;
      }

      /* Before a project is chosen, clamp only to the union of every offered
         project's range -- the visitor has not told us which bounds apply yet,
         and the default project's must not be baked in. */
      const bounds = chosen.project
        ? { min: sizeConfig.min, max: sizeConfig.max }
        : PROJECT_TYPE_ORDER.reduce(
            (acc, t) => ({
              min: Math.min(acc.min, PROJECT_SIZE_CONFIG[t].min),
              max: Math.max(acc.max, PROJECT_SIZE_CONFIG[t].max),
            }),
            { min: Infinity, max: -Infinity },
          );
      const change = applyPlanToEstimate(plan, bounds);

      /* Anything the plans rewrite over an answer the visitor already gave is
         stated back explicitly -- see planChanged. */
      const changed: string[] = [];
      const filled: typeof planFilled = {};
      if (change.sqft !== undefined) {
        if (chosen.subtype && change.sqft !== sqft) {
          changed.push(
            `Finished size updated from ${sqft.toLocaleString()} to ${change.sqft.toLocaleString()} sq ft`,
          );
        }
        setSqft(change.sqft);
        planSqftRaw.current = change.sqft;
        filled.size = true;
      }
      if (change.bathroomCount !== undefined) {
        if (bathCount !== null && bathCount !== change.bathroomCount) {
          changed.push(`Bathrooms updated from ${bathCount} to ${change.bathroomCount}`);
        }
        setBathCount(change.bathroomCount);
        setBathCountConfirmed(true);
        filled.baths = true;
      }
      if (change.accessoryStructures !== undefined) {
        if (structures !== null && structures.length > 0) {
          changed.push("Other structures updated to match your plans");
        }
        setStructures(change.accessoryStructures);
        filled.structures = true;
      }
      setPlanChanged(changed);
      setPlanFilled((prev) => ({ ...prev, ...filled }));
      /* stories, garage bays, covered outdoor and basement live in the subtype
         seed rather than in their own state, so they are carried as an override
         that buildRefinements applies last. Only fields the drawings settled are
         written: a second, sparser upload must not blank what the first one
         read, so undefined values are dropped rather than assigned. */
      setPlanOverrides((prev) => {
        const next = { ...prev };
        if (change.stories !== undefined) next.stories = change.stories;
        if (change.garageBays !== undefined) next.garageBays = change.garageBays;
        if (change.coveredOutdoor !== undefined) next.coveredOutdoor = change.coveredOutdoor;
        if (change.basementType !== undefined) next.basementType = change.basementType;
        return next;
      });
      /* The drawings are the newer statement than any fine-tuning made before
         the upload, and their steps collapse into "from your plans" cards, so
         a stale manual pick must not silently outrank what was just read
         (the fine-tuning controls merge LAST in the refinements memo). */
      if (change.garageBays !== undefined) {
        setGarageBaysChoice(null);
        setGarageSqftInput("");
      }
      if (change.basementType !== undefined) {
        setBasementSize("full");
        setBasementSqftInput("");
      }
      if (change.coveredOutdoor !== undefined) setPatioSqftInput("");

      setPlanApplied(change.applied);
      setPlanUnderstood(change.understood);
      setPlanUnresolved(change.unresolved);
      setEdited(true);
      /* Land on the review summary rather than past it: the visitor reads what
         the drawings settled before moving on. */
      scheduleScroll(() => planUploadRef.current);
      trackEvent("estimator_plan_uploaded", {
        applied: change.applied.length,
        understood: change.understood.length,
        files: fileList.length,
      });
    } catch {
      setPlanError("Could not reach the plan review service. Try again in a moment.");
    } finally {
      setPlanBusy(false);
    }
  }

  /* The grid card tap. The card names a home type; land ownership decides the
     internal project type the engine prices (own + Custom Home runs the
     build-on-your-lot rules, exactly as the old BOL card did). */
  function handleSelectProject(cardType: ProjectType) {
    const type = resolveProjectType(cardType, landOwnership);
    if (type === activeProject && chosen.project) return;
    applyProjectSelection(type);
  }

  function applyProjectSelection(type: ProjectType) {
    const sub = defaultSubtypeFor(type);
    setActiveProject(type);
    setSubtype(sub);
    /* A size read from the visitor's drawings outranks a card's preset: the
       upload now happens before the project is picked, so this reset must not
       clobber a plan-settled figure. Clamped to the new project's range. */
    if (planFilled.size) {
      const c = PROJECT_SIZE_CONFIG[type];
      /* Re-clamp from the RAW plan reading, not the currently clamped value,
         so switching projects can recover the figure the drawings stated. */
      setSqft((s) => Math.max(c.min, Math.min(c.max, planSqftRaw.current ?? s)));
    } else {
      setSqft(SUBTYPE_DATA[type][sub].sqft);
    }
    setAddOns([]);
    /* Size fine-tuning answers describe the previous project's garage,
       basement and patio, so they reset with the chips they refine. */
    setGarageBaysChoice(null);
    setGarageSqftInput("");
    setBasementSize("full");
    setBasementSqftInput("");
    setPatioSqftInput("");
    const avail = getAvailableFinishLevels(type);
    if (!avail.includes(finish)) setFinish("mid-range");
    setPeScope(null);
    setCabTier(null);
    /* A bathroom count read from the drawings is a fact about the home, not
       about which project card is active -- same rule as plan-settled size
       above. Clearing it here would silently discard the uploaded answer
       before the bathroom step ever rendered its "from your plans" card. */
    if (!planFilled.baths) {
      setBathCount(null);
      setBathCountConfirmed(false);
    }
    setKitchenIn(null);
    // Changing the project invalidates the layout and finish choices made under
    // the previous one, so the visitor picks those again rather than inheriting.
    allChosenScrolled.current = false;
    /* `stage` is carried rather than reset: the planning stage is a fact about
       the person, not about the project they just picked, and clearing it would
       bounce them back to question one for changing their mind. */
    setChosen((p) => ({ ...p, project: true, subtype: false, finish: false }));
    fireEstimatorEngagement();
    /* Advance to the next step (address) directly from the tap, so it fires
       even when the visitor confirms the already-active default project. */
    scheduleScroll(() => addressStepRef.current);
  }

  /* Selecting a layout sets a smart default size, which the slider fine-tunes. */
  function handleSelectSubtype(id: string) {
    setSubtype(id);
    setChosen((p) => ({ ...p, subtype: true }));
    const data = SUBTYPE_DATA[activeProject]?.[id];
    if (data) {
      const c = PROJECT_SIZE_CONFIG[data.projectOverride ?? activeProject];
      /* Same rule as handleSelectProject: the layout preset must not overwrite
         a size read from the drawings. */
      if (planFilled.size) {
        setSqft((s) => Math.max(c.min, Math.min(c.max, planSqftRaw.current ?? s)));
      } else {
        setSqft(Math.max(c.min, Math.min(c.max, data.sqft)));
      }
      /*
       * Pre-tick the chips a lot type implies, so the preset and the chips agree.
       *
       * The chips are the authority on garage, basement, patio and services (see
       * buildRefinements), so a preset that seeded "well and septic" would
       * otherwise be silently overridden the moment the price was computed. An
       * acreage lot almost certainly needs a well and a septic system, and a
       * visitor who knows better can untick it.
       */
      if (isNewConstructionProject(activeProject)) {
        const implied: string[] = [];
        if (data.refinements.garageBays === "three" || data.refinements.garageBays === "four") {
          implied.push("bigger-garage");
        }
        setAddOns(implied);
        /* The chips just got re-seeded from the card, so an explicit bay count
           picked under the previous layout no longer describes this one. */
        setGarageBaysChoice(null);
      }
    }
    fireEstimatorEngagement();
    /* Advance to the next step (size) directly from the tap, so it also fires
       when the visitor re-picks a different layout later. */
    scheduleScroll(() => sizeRef.current);
  }

  function handleSelectFinish(level: FinishLevel) {
    setFinish(level);
    setChosen((p) => ({ ...p, finish: true }));
    fireEstimatorEngagement();
  }

  /**
   * Which plan reading a chip supersedes.
   *
   * The chips and the plan overrides both write the same refinements, and the
   * overrides merge last so they would otherwise win permanently: someone whose
   * drawings showed a two-bay garage could tap "bigger garage" and watch
   * nothing happen. Tapping a chip is the more recent statement of intent, so
   * it drops the plan's reading of that one field and leaves the rest alone.
   */
  const CHIP_SUPERSEDES: Record<string, keyof EstimateRefinements> = {
    basement: "basementType",
    "bigger-garage": "garageBays",
    "covered-patio": "coveredOutdoor",
  };

  function handleToggleChip(id: string) {
    setAddOns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    const superseded = CHIP_SUPERSEDES[id];
    if (superseded) {
      setPlanOverrides((prev) => {
        if (prev[superseded] === undefined) return prev;
        const next = { ...prev };
        delete next[superseded];
        return next;
      });
    }
    /* Tapping a chip is the more recent statement than the fine-tuning it
       governs, so the fine-tuning resets rather than silently overriding it. */
    if (id === "bigger-garage") setGarageBaysChoice(null);
    if (id === "basement") {
      setBasementSize("full");
      setBasementSqftInput("");
    }
    if (id === "covered-patio") setPatioSqftInput("");
    fireEstimatorEngagement();
  }

  /** An explicit bay count: outranks the preset and the chip, and keeps the
      "3+ car garage" chip visually consistent with what was picked. */
  function handlePickGarageBays(bays: "two" | "three" | "four") {
    setGarageBaysChoice(bays);
    setAddOns((prev) => {
      const has = prev.includes("bigger-garage");
      if (bays === "two") return has ? prev.filter((c) => c !== "bigger-garage") : prev;
      return has ? prev : [...prev, "bigger-garage"];
    });
    /* Same rule as CHIP_SUPERSEDES: the tap is more recent than the drawings. */
    setPlanOverrides((prev) => {
      if (prev.garageBays === undefined) return prev;
      const next = { ...prev };
      delete next.garageBays;
      return next;
    });
    setEdited(true);
    fireEstimatorEngagement();
  }

  function handleSqft(value: number) {
    setSqft(value);
    /* Dragging the slider is the visitor taking the answer back from the
       plans: their edit is authoritative from here on. */
    setPlanFilled((p) => (p.size ? { ...p, size: false } : p));
    fireEstimatorEngagement();
  }

  function handleBookVisit() {
    fireEstimatorEngagement();
    if (onBookVisitProp) {
      onBookVisitProp();
    } else {
      document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ── Which questions are worth asking ──────────────────────────────────
     A question only earns a place if its answer can change the estimate for
     the work the visitor actually described. Asking about cabinetry when they
     never said they are touching cabinets is noise, and answering it would
     move a price for work that is not in scope. */

  /* Upgrade chips that imply plumbing or electrical work is in play. */
  const SYSTEMS_CHIPS: Record<ProjectType, string[]> = {
    /* A new home is plumbed and wired from nothing, so there is no partial
       systems scope to ask about; see ALWAYS_HAS_SYSTEMS below. */
    "custom-home": [],
    "semi-custom-home": [],
    "build-on-your-lot": [],
    "shop-home": [],
    kitchen: ["counters", "lighting"],
    bathroom: ["shower", "vanity", "tub"],
    "whole-home": ["kitchen", "baths", "layout"],
    addition: [],
    adu: [],
    basement: ["bath", "wet-bar", "egress"],
  };
  /* New construction always carries its own systems, whatever else is ticked.
     Asking a new-home buyer whether plumbing is "staying put" is meaningless:
     there is nothing there yet, so every system is new by definition. */
  const ALWAYS_HAS_SYSTEMS: ProjectType[] = [
    "custom-home", "semi-custom-home", "build-on-your-lot", "shop-home", "addition", "adu",
  ];

  const showCabinetry = effectiveProject === "kitchen" && addOns.includes("cabinets");
  /* Bathrooms drive a whole-home budget more than anything else, so the count is
     asked whenever baths are in scope. With no chips ticked the scope is still
     unknown and a whole-home almost always includes baths, so it is asked then
     too. The kitchen question appears the same way. */
  const showBathCount = getAssumedBathrooms(effectiveProject) !== null;
  /* When the "kitchen" chip is selected for a whole-home project the visitor
     has already answered the kitchen-included question implicitly (yes). Show
     the follow-up step only when the chip has NOT answered it. */
  const kitchenChipAnswersQuestion =
    effectiveProject === "whole-home" && addOns.includes("kitchen");
  const showKitchenIncluded =
    getKitchenQuestion(effectiveProject) !== null && !kitchenChipAnswersQuestion;
  const showSystems =
    ALWAYS_HAS_SYSTEMS.includes(effectiveProject) ||
    // No chips ticked means we do not know the scope yet, and systems work is
    // too big a cost driver to quietly assume away.
    addOns.length === 0 ||
    addOns.some((id) => SYSTEMS_CHIPS[effectiveProject].includes(id));

  /* A hidden question must not keep pricing the estimate. Clearing the value
     when its step disappears is what stops an invisible input from moving the
     number, which is the same failure the upgrade chips used to cause. */
  /* The estimator configures the project rather than interrogating the visitor.
     Choosing a finish level loads what that level typically includes, so nobody
     is asked whether their cabinetry is "semi-custom" or whether their plumbing
     counts as relocated. Both are shown and both are editable; once the visitor
     changes one, the profile stops touching their choices. */
  const typical = useMemo(
    () => getTypicalSelections(effectiveProject, finish),
    [effectiveProject, finish],
  );

  /* Sizing the engine bakes in without asking: garage bays map to fixed areas,
     a basement follows the main-floor footprint, a covered patio prices at a
     set area, and front-yard landscaping with a driveway is always included.
     Stated plainly so the estimate never rests on an assumption the visitor
     was never shown. Mirrors resolve.ts (GARAGE_BAY_SQFT, basement footprint)
     and newConstructionRules (landscape and driveway scope). */
  const bakedAssumptions = useMemo(() => {
    if (!isNewBuild) return [] as string[];
    const a: string[] = [];
    const bayAreas: Record<string, { word: string; sf: number }> = {
      two: { word: "2", sf: 480 },
      three: { word: "3", sf: 720 },
      four: { word: "4", sf: 960 },
    };
    const bay = refinements.garageBays ? bayAreas[refinements.garageBays] : undefined;
    if (bay) {
      const sf = refinements.garageSqft && refinements.garageSqft > 0 ? refinements.garageSqft : bay.sf;
      a.push(`An attached ${bay.word}-car garage, priced at about ${sf} sq ft`);
    }
    const basementSized =
      refinements.basementSqft && refinements.basementSqft > 0
        ? `partial basement of about ${refinements.basementSqft.toLocaleString()} sq ft`
        : "basement sized to the main-floor footprint";
    if (refinements.basementType === "unfinished") {
      a.push(`An unfinished ${basementSized}`);
    } else if (refinements.basementType === "finished") {
      a.push(`A finished ${basementSized}, counted as living space`);
    }
    if (refinements.coveredOutdoor && refinements.coveredOutdoor > 0) {
      a.push(`A covered patio priced at about ${refinements.coveredOutdoor} sq ft`);
    }
    a.push("Driveway, walkways and front-yard landscaping (topsoil, sod, irrigation, plantings)");
    return a;
  }, [
    isNewBuild, refinements.garageBays, refinements.garageSqft,
    refinements.basementType, refinements.basementSqft, refinements.coveredOutdoor,
  ]);

  useEffect(() => {
    if (!chosen.finish || edited) return;
    setPeScope(typical.plumbingElectrical);
    setCabTier(typical.cabinetTier);
  }, [chosen.finish, edited, typical]);

  useEffect(() => {
    if (!showCabinetry) setCabTier((prev) => (prev === null ? prev : null));
  }, [showCabinetry]);
  useEffect(() => {
    if (!showSystems) setPeScope((prev) => (prev === null ? prev : null));
  }, [showSystems]);
  useEffect(() => {
    if (!showBathCount) setBathCount((prev) => (prev === null ? prev : null));
  }, [showBathCount]);
  useEffect(() => {
    if (!showKitchenIncluded) setKitchenIn((prev) => (prev === null ? prev : null));
  }, [showKitchenIncluded]);

  /* Sync kitchenIn with the whole-home kitchen chip selection. When the chip
     implicitly answers the kitchen question, set state to true so pricing is
     consistent with what the visitor indicated via the chip. When the chip is
     deselected, reset to null so the kitchen step shows as unanswered. */
  useEffect(() => {
    if (kitchenChipAnswersQuestion) {
      setKitchenIn(true);
    } else {
      setKitchenIn(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenChipAnswersQuestion]);

  /* Address scroll fires directly from handleSelectProject (see above), so it
     also works when the visitor confirms the already-active default project. */

  /* Size scroll fires directly from handleSelectSubtype (see above). */

  /* NOTE: sections that mount (bath count, kitchen, finish) never scroll by
     themselves anymore. Auto-scroll advances only in direct response to a
     user tap, from the click handlers below -- each tap moves to exactly the
     next step in visual sequence and can never skip an incomplete one. */

  /* Scroll to the typical-selections panel when finish is chosen. */
  useEffect(() => {
    if (chosen.finish) {
      scheduleScroll(() => typicalRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen.finish]);

  /* Scroll to the gate form when it opens. */
  useEffect(() => {
    if (gateOpen) {
      scheduleScroll(() => gateFormRef.current);
    }
  }, [gateOpen]);

  /*
   * "Asked, none wanted" is a real answer, so reaching the structures step is
   * what records it. Without this the array stays null, allChosen never becomes
   * true for the large majority who want only a house, and the estimator would
   * refuse to produce a range until somebody ticked a barn.
   */
  useEffect(() => {
    if (chosen.subtype && structures === null) setStructures([]);
  }, [chosen.subtype, structures]);

  /*
   * Plan upload is offered only to the two stages that have drawings to give.
   *
   * Declared here rather than beside the section it renders, because
   * visibleSteps below reads it and the step numbering would hit a temporal
   * dead zone otherwise.
   */
  const showPlanUpload =
    planningStage === "have-plans" || planningStage === "plans-in-progress";

  /* ── Which questions the drawings have already answered ──────────────────
     Each flag collapses its step into a one-line "from your plans" card; the
     Edit affordance drops the plan's authority (the override) and re-expands
     the manual control. Partial plan sets degrade gracefully: only the facts
     the extraction actually returned suppress anything.

     Layout is suppressed only for the custom-home card, whose layout cards
     literally ask how many levels the home has -- a fact a plan set states.
     The owned-land layout cards describe the LOT and the shop-home cards
     describe the house/shop ratio; drawings settle neither, so those stay
     open. Finish level is deliberately never suppressed: it is a major cost
     driver no plan set can state. */
  const planAnsweredLayout =
    activeProject === "custom-home" && planOverrides.stories !== undefined;
  const planAnsweredGarage = planOverrides.garageBays !== undefined;
  const planAnsweredBasement = planOverrides.basementType !== undefined;
  const planAnsweredPatio = planOverrides.coveredOutdoor !== undefined;

  /* When the drawings answered the layout question, the step is a collapsed
     card rather than a grid, so reaching it must record the answer the same
     way tapping a card would -- otherwise everything below stays hidden. The
     subtype is set to the card the stories imply so its seed and labels agree
     with the drawings (the plan override still outranks the seed). */
  useEffect(() => {
    if (!chosen.project || chosen.subtype || !planAnsweredLayout) return;
    setSubtype((planOverrides.stories ?? 1) >= 2 ? "two-story" : "single-level");
    setChosen((p) => ({ ...p, subtype: true }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen.project, chosen.subtype, planAnsweredLayout]);

  /* Numbers are derived, never hardcoded, so a hidden step cannot leave a gap
     in the sequence the visitor reads. Plan upload sits directly after the
     stage question: a visitor who says "I have completed plans" hands them
     over first, so the drawings answer questions before they are ever asked.
     Address appears early so the property lookup can pre-fill the size
     slider. */
  const visibleSteps: string[] = [
    "stage",
    ...(showPlanUpload ? ["plans"] : []),
    "land",
    "project",
    /* One slot, two shapes: street address + property lookup for landowners,
       a light "where do you plan to build" question for everyone else. */
    "address",
    "layout",
    "size",
    ...(ownsLand && isNewConstructionProject(effectiveProject) ? ["site"] : []),
    "upgrades",
    ...(showBathCount ? ["bathcount"] : []),
    ...(showKitchenIncluded ? ["kitchen"] : []),
    "structures",
    "finish",
  ];
  const stepNo = (id: string) => visibleSteps.indexOf(id) + 1;

  /* Only the things a homeowner actually knows are required: their project,
     layout, size, finish, bathroom count and whether the kitchen is in scope.
     Cabinetry and systems scope are pre-selected from the finish profile, so
     they always hold a value and never block completion. */
  const allChosen =
    chosen.stage &&
    chosen.land &&
    chosen.project &&
    chosen.subtype &&
    chosen.finish &&
    (!showBathCount || bathCount !== null) &&
    /* Structures are answered by reaching the step, not by ticking one: an empty
       array means "asked, none wanted" and is a complete answer. Only null,
       meaning the step was never rendered, blocks completion. */
    structures !== null &&
    (!showKitchenIncluded || kitchenIn !== null);

  /* ── Persist to sessionStorage, but only once the visitor has actually
     answered every question ──

     This used to run unconditionally on mount. The estimator sits on the
     homepage, so simply loading the page wrote a complete-looking estimate
     built from the defaults the component initialises with: a custom home,
     2,200 sq ft, mid-range, $540,000 to $735,000. ConsultationForm reads this
     key on mount, and when it finds one it attaches it to the lead and sets
     the project type. A visitor who scrolled straight past the estimator and
     filled in the contact form therefore sent us, and received back by email,
     a detailed estimate for a house they never described.

     It lives below allChosen rather than up with the other derived state
     because it depends on it, and reading allChosen before its declaration
     would be a temporal dead zone error at render time.

     Nothing is stored until the estimate is real, and the key is cleared if
     the visitor reopens the flow and leaves it incomplete, so a stale record
     cannot outlive the selections that produced it. */
  useEffect(() => {
    if (!allChosen) {
      sessionStorage.removeItem("brc_estimate");
      window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
      return;
    }
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify({
        ...buildStoredEstimate(input, userRefinementCount),
        // buildStoredEstimate calls the guide engine directly, so without this
        // the stored record carried guide prices while the panel above showed
        // the line-item engine's. The consultation form, both emails and the
        // CRM all read this record, so the two must not diverge: take the
        // price from `result`, which is the number the visitor actually saw.
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        // Carried alongside the engine result so the consultation form can
        // forward the visitor's literal choices to the emails. Without these
        // the emails could only show derived values (for example "moderate
        // layout changes") and never the card the visitor actually clicked.
        statedBudget: budgetValue,
        layoutLabel: selectedLayoutLabel,
        upgradeLabels: selectedUpgradeLabels,
        /* Carried so the lead record and the internal email can link the
           drawings. Stored even when extraction failed or the set turned out to
           be a remodel: the files are filed against the lead either way, and a
           builder wants to open them before the first call regardless of what
           the extractor made of them. */
        planFiles: planStored,
      }),
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChosen, effectiveProject, finish, sqft, refinements, userRefinementCount, planStored]);

  /* Scroll to the gate CTA (or result panel for returning visitors) the first
     time all required choices are made. Must live after allChosen is defined.
     Auto-scroll must only ever follow an explicit user tap: a bath count
     pre-filled from property data counts toward allChosen (the estimate can
     price it) but does NOT count for scrolling until the visitor confirms it
     with a tap (bathCountConfirmed). Without this, assessor data arriving in
     the background could yank the page to the CTA past unvisited steps. */
  const bathConfirmedForScroll = !showBathCount || bathCountConfirmed;
  useEffect(() => {
    if (allChosen && bathConfirmedForScroll && !allChosenScrolled.current) {
      /* Only burn the one-shot sentinel if this scroll was actually queued.
         If an earlier step's scroll already claimed this frame (first wins),
         that earlier step is the correct target and the CTA stays reachable. */
      if (scheduleScroll(() => ctaAreaRef.current ?? resultRef.current)) {
        allChosenScrolled.current = true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChosen, bathConfirmedForScroll]);

  /* Mobile sticky bar: visible while the inline estimator section is on screen. */
  const [sectionVisible, setSectionVisible] = useState(true);
  useEffect(() => {
    if (inModal) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setSectionVisible(entry.isIntersecting),
      { root: null, rootMargin: "0px", threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inModal]);

  const stickySummary = useMemo(() => {
    if (!chosen.project) return "Choose your project type";
    const parts = [config.tabLabel];
    if (chosen.subtype) {
      const title = config.subtypes.find((s) => s.id === subtype)?.title;
      if (title) parts.push(title);
    }
    if (chosen.finish) parts.push(finishLabels[finish].label);
    return parts.join(" · ");
  }, [chosen.project, chosen.subtype, chosen.finish, config, subtype, finish, finishLabels]);

  const handleStickyCta = () => {
    if (gateSubmitted) {
      document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
      onBookVisitProp?.();
      return;
    }
    if (allChosen) {
      setGateOpen(true);
      scheduleScroll(() => gateFormRef.current ?? ctaAreaRef.current);
      return;
    }
    if (!chosen.project) {
      scheduleScroll(() => layoutRef.current);
    } else if (!chosen.subtype) {
      scheduleScroll(() => layoutRef.current);
    } else if (!chosen.finish) {
      scheduleScroll(() => finishRef.current);
    }
  };

  /* Identity of the current estimate. Used to tell whether the visitor has
     actually changed something since we last told the team about it. */
  const estimateKey = [
    effectiveProject, finish, sqft,
    JSON.stringify(refinements),
    selectedLayoutLabel ?? "",
    selectedUpgradeLabels.join("|"),
  ].join("~");

  const hasUnsentChanges = lastSentKey !== null && lastSentKey !== estimateKey;

  /* Send an UPDATED estimate using the contact details we already hold, so a
     visitor who reworks their project can tell us without retyping anything and
     the team sees the revision rather than the abandoned first pass. */
  async function handleResend() {
    if (!savedIdentity?.email) return;
    setResendState("sending");
    try {
      const res = await fetch("/api/estimate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: savedIdentity.name,
          email: savedIdentity.email,
          phone: savedIdentity.phone,
          projectType: effectiveProject,
          estimate: {
            project: effectiveProject,
            finish,
            sqft,
            priceLow: result.priceLow,
            priceHigh: result.priceHigh,
            roi: result.roi,
            refinements,
            statedBudget: budgetValue,
            layoutLabel: selectedLayoutLabel,
            upgradeLabels: selectedUpgradeLabels,
          },
        }),
      });
      if (!res.ok && res.status < 500) throw new Error(String(res.status));
      setLastSentKey(estimateKey);
      writeLastSentKey(estimateKey);
      setResendState("sent");
      trackEvent("generate_lead", { project: effectiveProject, source: "estimate_resend" });
    } catch {
      setResendState("error");
    }
  }

  /* Let the visitor correct details we hold. Reopens the gate prefilled, rather
     than wiping it, so editing is a change and not a re-registration. */
  function handleEditIdentity() {
    setGateSubmitted(false);
    setGateOpen(true);
    setResendState("idle");
  }

  /* Forget this visitor on this device (shared computers, wrong person). */
  function handleForgetIdentity() {
    clearStoredIdentity();
    setSavedIdentity(null);
    setGateSubmitted(false);
    setGateOpen(false);
    setLastSentKey(null);
    setResendState("idle");
    setGateName(""); setGateEmail(""); setGatePhone("");
  }

  async function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();

    /* Explicit client-side validation before touching the API */
    if (!gateName.trim() || gateName.trim().length < 2) {
      setGateError("Please enter your first name.");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!gateEmail.trim() || !emailRe.test(gateEmail.trim())) {
      setGateError("Please enter a valid email address.");
      return;
    }
    if (gatePhone.replace(/\D/g, "").length < 10) {
      setGateError("Please enter a valid 10-digit phone number.");
      return;
    }
    /* A street address is only demanded of someone who has one: landowners
       get the house-number check; everyone else just needs to name the city
       or area they plan to build in. */
    if (ownsLand) {
      if (!gateAddress.trim() || !HOUSE_NUMBER_REGEX.test(gateAddress.trim())) {
        setGateError("Please scroll up and enter your property address (must include a house number).");
        return;
      }
    } else if (buildArea.trim().length < 2) {
      setGateError("Please scroll up and tell us the city or area you plan to build in.");
      return;
    }
    /* Budget is optional: an extra required field before the number is friction
       and reads as a bait-and-switch. We still capture it when offered. */

    /* Carry the contact info they just entered to the consultation form, so
       booking a visit is one tap and never asks for name / email / phone again. */
    writeStoredPrefill({
      name: gateName.trim(),
      email: gateEmail.trim(),
      phone: gatePhone.trim(),
      /* Only a real street address is worth prefilling into other forms; a
         build area is not an address and must not masquerade as one. */
      address: ownsLand ? gateAddress.trim() : undefined,
      zip: gateProfile?.zip?.slice(0, 5) || extractZip(gateAddress) || undefined,
    });

    setGateLoading(true);
    setGateError(null);

    const payload = {
      name: gateName.trim(),
      email: gateEmail.trim(),
      phone: gatePhone.trim(),
      /* The CRM's budget field is free text and predates this form, so it keeps
         receiving a readable string while `estimate.statedBudget` below carries
         the number the engine actually solves against. Omitted when blank: the
         API treats budget as optional but rejects "". */
      budget: budgetValue ? `$${budgetValue.toLocaleString("en-US")}` : undefined,
      projectType: effectiveProject,
      /* Landowners send their street address; everyone else sends the area
         they plan to build in. Never both -- the API records whichever the
         visitor's situation makes true. */
      address: ownsLand ? gateAddress.trim() : undefined,
      buildArea: ownsLand ? undefined : buildArea.trim(),
      landOwnership: landOwnership ?? undefined,
      /* Zip and property profile describe a specific parcel, so they only
         travel with an owner's lead: for anyone else they would be leftovers
         from a property they just said they do not have. */
      zip: ownsLand
        ? gateProfile?.zip?.slice(0, 5) || extractZip(gateAddress) || undefined
        : undefined,
      propertyProfile: ownsLand ? gateProfile : null,
      estimate: {
        project: effectiveProject,
        finish,
        sqft,
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        roi: result.roi,
        refinements,
        statedBudget: budgetValue,
        layoutLabel: selectedLayoutLabel,
        upgradeLabels: selectedUpgradeLabels,
      },
    };

    try {
      const res = await fetch("/api/estimate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        /* Happy path: contact captured, reveal result */
        trackMetaEvent("Lead", {
          content_name: effectiveProject,
          content_category: "estimate_gate",
        });
        trackEvent("generate_lead", { project: effectiveProject, source: "estimate_gate" });
        markGatePassed();
        setSavedIdentity({ name: gateName.trim(), email: gateEmail.trim(), phone: gatePhone.trim() });
        setLastSentKey(estimateKey);
        writeLastSentKey(estimateKey);
        setResendState("idle");
        setGateSubmitted(true);
        scheduleScroll(() => resultRef.current);
      } else if (res.status >= 500) {
        /* Server/infra error: not the user's fault; reveal so they aren't hard-blocked */
        console.warn("[gate] Server error", res.status, "- revealing estimate anyway");
        markGatePassed();
        setGateSubmitted(true);
      } else {
        /* 4xx: our client validation should have caught this; show error, keep gate */
        console.warn("[gate] API returned", res.status);
        setGateError("Something went wrong. Please check your info and try again.");
        setGateLoading(false);
        return;
      }
    } catch (err) {
      /* Network failure: reveal so infra issues never block a real user */
      console.warn("[gate] Network error:", err);
      markGatePassed();
      setGateSubmitted(true);
    }

    setGateLoading(false);
  }

  /* ── Shared dark card class ── */
  function darkCard(active: boolean) {
    return cn(
      "relative rounded-md border text-left transition-all duration-200",
      active
        ? "border-accent-legible bg-accent/10 ring-2 ring-accent-legible/25 shadow-[0_0_0_1px_hsl(var(--accent-legible)/0.35)]"
        : "border-accent-legible/30 bg-inverse-foreground/[0.07] hover:border-accent-legible/55 hover:bg-inverse-foreground/[0.11] hover-elevate",
    );
  }

  const renderStepLabel = (stepKey: Parameters<typeof stepNo>[0], label: string, className?: string) => (
    <p className={cn("block text-[13px] tracking-[0.12em] uppercase mb-3", className)}>
      <span className="text-accent-legible">{stepNo(stepKey)}</span>
      <span className="text-inverse-muted/50 mx-2" aria-hidden>
        ·
      </span>
      <span className="text-inverse-foreground/90">{label}</span>
    </p>
  );

  function darkChoice(active: boolean) {
    return cn(
      "rounded-md border transition-all duration-200",
      active
        ? "border-accent-legible bg-accent/10 ring-2 ring-accent-legible/25 shadow-[0_0_0_1px_hsl(var(--accent-legible)/0.35)] text-inverse-foreground"
        : "border-accent-legible/30 bg-inverse-foreground/[0.07] text-inverse-muted hover:border-accent-legible/55 hover:bg-inverse-foreground/[0.11] hover-elevate",
    );
  }

  /* ══════════════════════════════
     SECTIONS
  ══════════════════════════════ */

  /*
   * Step 1 - Planning stage.
   *
   * Full-width rows rather than the two-up grid the other steps use, because
   * these four answers are sentences rather than labels and a 2-column layout
   * truncates them on a phone, which is where most of this traffic is.
   */
  const planningStageStep = (
    <div className="mb-6">
      {renderStepLabel("stage", "How far along are you?")}
      <p className="text-[13px] text-inverse-muted -mt-1 mb-3 max-w-prose">
        This is about your planning, not the home itself -- you will pick the
        type of build next. The further along you are, the tighter the range we
        can honestly give you. If you already have drawings, you can hand them
        over right after this and skip most of the questions.
      </p>
      <div className="grid gap-2.5" role="radiogroup" aria-label="Planning stage">
        {PLANNING_STAGES.map((stage) => {
          const meta = PLANNING_STAGE_LABELS[stage];
          const active = chosen.stage && planningStage === stage;
          return (
            <button
              key={stage}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelectStage(stage)}
              data-testid={`calc-stage-${stage}`}
              className={cn(darkCard(active), "flex items-center gap-3 px-4 py-3.5 text-left min-h-[58px]")}
            >
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] text-inverse-foreground leading-tight">
                  {meta.label}
                </span>
                <span className="block text-[12.5px] text-inverse-muted mt-0.5">{meta.sub}</span>
              </div>
              {active && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                  <Check className="h-3 w-3 text-inverse" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Land ownership -- a situation question, before the home itself. */
  const landStep = (
    <div className="mb-6 scroll-mt-20" ref={landStepRef}>
      {renderStepLabel("land", "Do you already own the land?")}
      <p className="text-[13px] text-inverse-muted -mt-1 mb-3 max-w-prose">
        Owning the lot changes which questions matter: we will ask about your
        property and site instead of guessing at them.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Land ownership">
        {([
          { value: "own" as const, label: "Yes, I own the lot", sub: "Or are under contract on it", icon: Trees },
          { value: "not-yet" as const, label: "Not yet", sub: "Still looking or deciding", icon: MapPin },
        ]).map((opt) => {
          const active = chosen.land && landOwnership === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelectLand(opt.value)}
              data-testid={`calc-land-${opt.value}`}
              className={cn(darkCard(active), "flex items-center gap-3 px-4 py-3.5 min-h-[58px]")}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-accent-legible" : "text-inverse-muted")} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-inverse-foreground leading-tight">{opt.label}</span>
                <span className="block text-[12px] text-inverse-muted mt-0.5">{opt.sub}</span>
              </span>
              {active && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                  <Check className="h-3 w-3 text-inverse" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Step - Project type: prominent card grid (matches the other inputs) */
  const projectGrid = (
    <div className="mb-6" ref={projectGridRef}>
      {renderStepLabel("project", "What are we building?")}
      <p className="text-[13px] text-inverse-muted -mt-1 mb-3 max-w-prose">
        Now the home itself. Every one of these is a new build -- they differ in
        how the design starts and where it goes.
      </p>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        role="tablist"
        aria-label="Project type"
      >
        {PROJECT_TYPE_ORDER.map((type) => {
          const pc = PROJECT_CONFIGS[type];
          const Icon = PROJECT_ICONS[type];
          /* A landowner's custom home is priced internally as build-on-your-lot,
             so the Custom Home card must read as selected for either type. */
          const active = chosen.project && cardTypeOf(activeProject) === type;
          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectProject(type)}
              data-testid={`calc-tab-${type}`}
              className={cn(darkCard(active), "flex items-center gap-3 px-4 py-3.5 min-h-[58px]")}
            >
              <Icon
                className={cn("h-5 w-5 flex-shrink-0", active ? "text-accent-legible" : "text-inverse-muted")}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-inverse-foreground leading-tight">{pc.tabLabel}</span>
                {pc.tabSub && (
                  <span className="block text-[12px] text-inverse-muted mt-0.5">{pc.tabSub}</span>
                )}
              </span>
              {active && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                  <Check className="h-3 w-3 text-inverse" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Intro - eyebrow + dynamic per-project headline */
  const intro = (
    <div className="mb-7">
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm bg-accent-legible/15 border border-accent-legible/30 text-accent-legible">
          <Calculator className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-[10px] md:text-[11px] tracking-[0.14em] uppercase text-inverse-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-legible" aria-hidden />
              Free
            </span>
            <span className="opacity-40" aria-hidden>·</span>
            <span>About 2 minutes</span>
            <span className="opacity-40" aria-hidden>·</span>
            <span>No obligation</span>
          </div>
          <p className="text-[12px] tracking-[0.16em] uppercase text-accent-legible/90 mb-2">
            Cost estimator
          </p>
        </div>
      </div>
      <h2 className="font-sans font-light text-[clamp(1.875rem,4.5vw,3.25rem)] leading-[1.06] tracking-tight text-inverse-foreground pb-6 border-b border-accent-legible/25">
        {!chosen.project ? (
          /* Before a project is picked the headline must not name one. */
          <>
            Estimate your <em className="brc-accent">new home</em> build cost
          </>
        ) : config.twoLineHeadline ? (
          <>
            {config.headlinePrefix}
            <br />
            <em className="brc-accent">{config.headlineAccent}</em> {config.headlineSuffix}
          </>
        ) : (
          <>
            {config.headlinePrefix} <em className="brc-accent">{config.headlineAccent}</em>{" "}
            {config.headlineSuffix}
          </>
        )}
      </h2>
    </div>
  );

  /* Shared input class for the plain-text inputs in the flow. */
  const flowInputClass =
    "w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-3 py-2.5 text-[16px] text-inverse-foreground placeholder:text-[13px] placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors";

  /* The non-landowner's version of the address slot: a city or area is enough
     to confirm the service area, and asking for a street address for land they
     do not own reads as either a mistake or a trap. */
  const areaStep = (
    <div className="mt-6 scroll-mt-20" ref={addressStepRef}>
      {renderStepLabel("address", "Where do you plan to build?")}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        A city or general area is plenty -- it confirms we serve where you are headed.
      </p>
      <input
        type="text"
        autoComplete="off"
        value={buildArea}
        onChange={(e) => setBuildArea(e.target.value)}
        placeholder="e.g. Meridian, Eagle, Kuna, or somewhere in the Treasure Valley"
        className={flowInputClass}
        maxLength={120}
        data-testid="early-input-build-area"
        aria-label="City or area where you plan to build"
      />
      <p className="mt-2 text-[12px] text-inverse-muted/90 leading-relaxed">
        You can skip ahead and fill it in later.
      </p>
    </div>
  );

  /* Step - Address, landowners only (so property data pre-fills the size
     slider and the gate form never has to ask for it again). Optional here;
     required when the gate form is submitted. The onProfileResolved handler
     snaps sqft to the home's measured interior square footage, bounded by the
     project range. */
  const addressStep = (
    <div className="mt-6 scroll-mt-20" ref={addressStepRef}>
      {renderStepLabel("address", "Where is your lot?")}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        Confirms we serve your area and auto-fills details if we find a match.
      </p>
      <AddressAutocomplete
        variant="inverse"
        value={gateAddress}
        onChange={setGateAddress}
        onProfileResolved={(profile) => {
          setGateProfile(profile);
          if (profile?.formattedAddress) setGateAddress(profile.formattedAddress);
          if (profile?.squareFootage) {
            setSqft(
              Math.max(sizeConfig.min, Math.min(sizeConfig.max, profile.squareFootage)),
            );
          }
          if (profile?.bathrooms !== undefined && showBathCount) {
            setBathCount(profile.bathrooms);
          }
          /* Do NOT auto-scroll to the layout step here. After the property card
             renders the subtype grid is immediately below it in the DOM; an extra
             scroll jump just disorients the visitor (perceived as "skipped step 2"
             or "jumped to the middle of step 3"). */
        }}
        data-testid="early-input-address"
      />
      <p className="mt-2 text-[12px] text-inverse-muted/90 leading-relaxed">
        Optional here -- you can skip ahead and fill it in later.
      </p>
    </div>
  );

  /* One-line "answered by your plans" card. Collapsing rather than hiding: the
     visitor sees the answer is recorded, where it came from, and how to take
     it back. Editing clears the plan mark, which re-expands the control and
     makes the visitor's input authoritative from then on. Declared before the
     first section that uses it (the layout step). */
  const planFilledCard = (
    label: string,
    value: string,
    onEdit: () => void,
    testId: string,
  ) => (
    <div
      className="flex items-center gap-3 rounded-md border border-accent-legible/40 bg-accent/10 px-4 py-3.5"
      data-testid={testId}
    >
      <Check className="h-4 w-4 flex-shrink-0 text-accent-legible" />
      <div className="min-w-0 flex-1">
        <span className="block text-[14px] text-inverse-foreground leading-tight">
          {label}: {value}
        </span>
        <span className="block text-[11.5px] text-inverse-muted mt-0.5">From your plans</span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex-shrink-0 text-[12.5px] text-inverse-foreground underline underline-offset-2 hover:opacity-80"
        data-testid={`${testId}-edit`}
      >
        Edit
      </button>
    </div>
  );

  /* Step 3 - Layout / type (drives refinement complexity). Collapses when the
     drawings stated how many levels the home has; Edit drops the plan's
     authority on stories and re-opens the grid. */
  const subtypeGrid = planAnsweredLayout ? (
    <div className="scroll-mt-20" ref={layoutRef}>
      {renderStepLabel("layout", config.gridLabel)}
      {planFilledCard(
        "Layout",
        (planOverrides.stories ?? 1) >= 2
          ? `${Math.round(planOverrides.stories ?? 2)}-story`
          : "Single level",
        () =>
          setPlanOverrides((prev) => {
            const next = { ...prev };
            delete next.stories;
            return next;
          }),
        "calc-planfilled-layout",
      )}
    </div>
  ) : (
    <div className="scroll-mt-20" ref={layoutRef}>
      {renderStepLabel("layout", config.gridLabel)}
      <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={config.gridLabel}>
        {config.subtypes.map((opt) => {
          const Icon = opt.icon;
          const active = chosen.subtype && subtype === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectSubtype(opt.id)}
              data-testid={`calc-subtype-${opt.id}`}
              aria-pressed={active}
              className={cn(darkCard(active), "flex items-start gap-3 p-4 min-h-[76px]")}
            >
              {active && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                  <Check className="h-3 w-3 text-inverse" />
                </span>
              )}
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent-legible" />
              <span className="min-w-0 pr-5">
                <span className="block text-[15px] text-inverse-foreground leading-tight">
                  {opt.title}
                </span>
                <span className="block text-[12.5px] italic text-inverse-muted leading-snug mt-1">
                  {opt.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Step 4 - Size: a precise sqft slider (cost is very size-sensitive). The chosen
     layout pre-sets a smart default; the slider fine-tunes for accuracy. */
  const sizePct = ((sqft - sizeConfig.min) / (sizeConfig.max - sizeConfig.min)) * 100;
  const sizeGrid = planFilled.size ? (
    <div className="mt-6 scroll-mt-20" ref={sizeRef}>
      {renderStepLabel("size", isNewBuild ? "Finished square feet?" : "About how big?")}
      {planFilledCard(
        "Finished size",
        `${sqft.toLocaleString()} sq ft`,
        () => setPlanFilled((p) => ({ ...p, size: false })),
        "calc-planfilled-size",
      )}
    </div>
  ) : (
    <div className="mt-6 scroll-mt-20" ref={sizeRef}>
      <div className="flex items-baseline justify-between mb-3">
        {renderStepLabel(
          "size",
          isNewBuild ? "Finished square feet?" : "About how big?",
          "mb-0",
        )}
        <span
          className="brc-display-num tabular-nums text-[22px] leading-none text-inverse-foreground"
          data-testid="calc-sqft-value"
        >
          {sqft.toLocaleString()}
          <span className="text-[13px] text-inverse-muted ml-1">sq ft</span>
        </span>
      </div>
      <input
        type="range"
        className="brc-slider"
        min={sizeConfig.min}
        max={sizeConfig.max}
        step={sizeConfig.step}
        value={sqft}
        onChange={(e) => handleSqft(Number(e.target.value))}
        data-testid="calc-sqft-slider"
        aria-label="Approximate square footage"
        style={{
          // backgroundImage, NOT the `background` shorthand. The shorthand
          // resets background-clip to border-box, which defeated the
          // content-box clip that keeps the painted track 3px tall inside a
          // 44px touch target - the slider rendered as a thick 44px bar.
          backgroundImage: `linear-gradient(to right, hsl(var(--accent-legible)) 0%, hsl(var(--accent-legible)) ${sizePct}%, hsl(var(--inverse-foreground) / 0.14) ${sizePct}%, hsl(var(--inverse-foreground) / 0.14) 100%)`,
        }}
      />
      <div className="flex justify-between mt-2 text-[12px] text-inverse-muted">
        <span>Compact ({sizeConfig.min.toLocaleString()})</span>
        <span>Large ({sizeConfig.max.toLocaleString()} sq ft)</span>
      </div>
      <p className="mt-2.5 text-[12.5px] text-inverse-muted/90 leading-relaxed">
        {isNewBuild ? (
          <>
            This is finished living space only. Leave out the garage and any unfinished basement,
            because those are priced separately below. Size is the biggest cost driver, so a closer
            number means a closer estimate.
          </>
        ) : (
          <>
            Not sure? The layout above sets a typical size. Drag only if your space is notably
            smaller or larger. Size is the biggest cost driver, so a closer number means a closer
            estimate.
          </>
        )}
      </p>
    </div>
  );

  /* Site questions, lot-owned paths only. Each answer feeds a real pricing
     input (site-difficulty multiplier, well/septic, utility runs, flatwork),
     which is why every question offers "Not sure": an unanswered or unsure
     question prices the simple case rather than guessing the expensive one. */
  const siteQuestion = <T extends string>(
    label: string,
    hint: string,
    value: T | null,
    setValue: (v: T) => void,
    options: { value: T; label: string; sub?: string }[],
    testPrefix: string,
  ) => (
    <div className="mb-4 last:mb-0">
      <p className="text-[12.5px] tracking-[0.06em] uppercase text-inverse-foreground/90 mb-0.5">{label}</p>
      <p className="text-[12px] text-inverse-muted/90 mb-2">{hint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setValue(opt.value);
                setEdited(true);
                fireEstimatorEngagement();
              }}
              data-testid={`calc-site-${testPrefix}-${opt.value}`}
              aria-pressed={active}
              className={cn(
                darkChoice(active),
                "py-2.5 px-2 min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-center",
              )}
            >
              <span className="text-[13px] text-inverse-foreground leading-tight">{opt.label}</span>
              {opt.sub && (
                <span className="text-[10.5px] text-inverse-muted leading-tight">{opt.sub}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const siteSection = (
    <div className="mt-5">
      {renderStepLabel("site", "A few things about your lot")}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        Site work is one of the biggest swings in a build on your own land, so these four
        answers move your range more than almost anything else. "Not sure" is a fine answer;
        it prices the typical case and we confirm it at the site visit.
      </p>
      {siteQuestion(
        "How is the ground?",
        "Slope decides how much digging, grading and engineering the site needs.",
        siteSlope,
        setSiteSlope,
        [
          { value: "flat", label: "Mostly flat", sub: "Easy to build on" },
          { value: "moderate", label: "Some slope", sub: "Needs cut and fill" },
          { value: "steep", label: "Steep", sub: "Likely engineered" },
          { value: "unsure", label: "Not sure" },
        ],
        "slope",
      )}
      {siteQuestion(
        "Water and sewer?",
        "A private well and septic system is the single largest site cost on a rural parcel.",
        siteWater,
        setSiteWater,
        [
          { value: "city", label: "City water + sewer", sub: "Connections at the street" },
          { value: "well-septic", label: "Well + septic", sub: "No city services" },
          { value: "unsure", label: "Not sure" },
        ],
        "water",
      )}
      {siteQuestion(
        "Power and gas at the lot?",
        "If service has not been brought to the lot line yet, the runs get longer and pricier.",
        siteUtilities,
        setSiteUtilities,
        [
          { value: "yes", label: "At the lot", sub: "Poles or boxes at the line" },
          { value: "no", label: "Not there yet", sub: "Needs to be brought in" },
          { value: "unsure", label: "Not sure" },
        ],
        "utilities",
      )}
      {siteQuestion(
        "About how long a driveway?",
        "From the road to where the house will sit. Longer drives mean more concrete or gravel.",
        siteDriveway,
        setSiteDriveway,
        [
          { value: "short", label: "Short", sub: "Under 75 ft, typical subdivision" },
          { value: "medium", label: "Medium", sub: "75 to 200 ft" },
          { value: "long", label: "Long", sub: "200 ft or more" },
          { value: "unsure", label: "Not sure" },
        ],
        "driveway",
      )}
    </div>
  );

  /* Size fine-tuning for new builds: garage bays, basement size and patio size
     were hidden presets (480/720/960 SF bays, full-footprint basement, 300 SF
     patio). These controls state them and let the visitor adjust; every value
     feeds the line-item engine, so changing one visibly moves the range. */
  const approxInputClass =
    "w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-3 py-2.5 text-[16px] text-inverse-foreground placeholder:text-[13px] placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors";
  const GARAGE_PRESET_SF: Record<string, number> = { two: 480, three: 720, four: 960 };
  /* Collapsed "from your plans" lines for garage, basement and patio. Each
     Edit drops that one plan override, which re-shows the chip and the manual
     control and hands authority back to the visitor's own taps. */
  const dropOverride = (key: keyof EstimateRefinements) => () =>
    setPlanOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const planFilledSizingCards = (planAnsweredGarage || planAnsweredBasement || planAnsweredPatio) && (
    <div className="mt-4 space-y-2">
      {planAnsweredGarage &&
        planFilledCard(
          "Garage",
          planOverrides.garageBays === "none"
            ? "None"
            : `${planOverrides.garageBays === "four" ? "4" : planOverrides.garageBays === "three" ? "3" : "2"}-car`,
          dropOverride("garageBays"),
          "calc-planfilled-garage",
        )}
      {planAnsweredBasement &&
        planFilledCard(
          "Basement",
          planOverrides.basementType === "finished"
            ? "Finished"
            : planOverrides.basementType === "unfinished"
              ? "Unfinished"
              : "None",
          dropOverride("basementType"),
          "calc-planfilled-basement",
        )}
      {planAnsweredPatio &&
        planFilledCard(
          "Covered patio",
          planOverrides.coveredOutdoor && planOverrides.coveredOutdoor > 0
            ? `About ${planOverrides.coveredOutdoor.toLocaleString()} sq ft`
            : "None",
          dropOverride("coveredOutdoor"),
          "calc-planfilled-patio",
        )}
    </div>
  );
  const sizeFineTuning = (
    <div className="mt-4 space-y-4">
      {!planAnsweredGarage && (
      <div>
        <p className="mb-2 text-[12px] tracking-[0.08em] uppercase text-inverse-muted/90">
          Garage size
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "two" as const, label: "2-car", sub: "About 480 sq ft" },
            { value: "three" as const, label: "3-car", sub: "About 720 sq ft" },
            { value: "four" as const, label: "4-car +", sub: "About 960 sq ft" },
          ]).map((opt) => {
            const active = refinements.garageBays === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePickGarageBays(opt.value)}
                data-testid={`calc-garage-bays-${opt.value}`}
                aria-pressed={active}
                className={cn(
                  darkChoice(active),
                  "py-2.5 px-2 min-h-[56px] flex flex-col items-center justify-center gap-0.5",
                )}
              >
                <span className="text-[13px] text-inverse-foreground leading-tight">{opt.label}</span>
                <span className="text-[10.5px] text-inverse-muted leading-tight">{opt.sub}</span>
              </button>
            );
          })}
        </div>
        {refinements.garageBays && refinements.garageBays !== "none" && (
          <div className="mt-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={garageSqftInput}
              onChange={(e) => setGarageSqftInput(e.target.value.replace(/[^\d,]/g, ""))}
              placeholder={`Know the size? About ${GARAGE_PRESET_SF[refinements.garageBays] ?? 480} sq ft assumed (optional)`}
              className={approxInputClass}
              data-testid="calc-garage-sqft"
              aria-label="Approximate garage size in square feet (optional)"
            />
          </div>
        )}
      </div>
      )}
      {!planAnsweredBasement && refinements.basementType && refinements.basementType !== "none" && (
        <div>
          <p className="mb-2 text-[12px] tracking-[0.08em] uppercase text-inverse-muted/90">
            Basement size
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "full" as const, label: "Full", sub: "Matches the main floor" },
              { value: "partial" as const, label: "Partial", sub: "Under part of the home" },
            ]).map((opt) => {
              const active = basementSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setBasementSize(opt.value);
                    if (opt.value === "full") setBasementSqftInput("");
                    setEdited(true);
                    fireEstimatorEngagement();
                  }}
                  data-testid={`calc-basement-size-${opt.value}`}
                  aria-pressed={active}
                  className={cn(
                    darkChoice(active),
                    "py-2.5 px-2 min-h-[56px] flex flex-col items-center justify-center gap-0.5",
                  )}
                >
                  <span className="text-[13px] text-inverse-foreground leading-tight">{opt.label}</span>
                  <span className="text-[10.5px] text-inverse-muted leading-tight">{opt.sub}</span>
                </button>
              );
            })}
          </div>
          {basementSize === "partial" && (
            <div className="mt-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={basementSqftInput}
                onChange={(e) => setBasementSqftInput(e.target.value.replace(/[^\d,]/g, ""))}
                placeholder={`About how many sq ft? Half the main floor (about ${Math.max(100, Math.round(sqft / Math.max(1, Math.round(refinements.stories ?? 1)) / 2)).toLocaleString()} sq ft) assumed until you say`}
                className={approxInputClass}
                data-testid="calc-basement-sqft"
                aria-label="Approximate basement size in square feet"
              />
            </div>
          )}
        </div>
      )}
      {!planAnsweredPatio && refinements.coveredOutdoor != null && refinements.coveredOutdoor > 0 && (
        <div>
          <p className="mb-2 text-[12px] tracking-[0.08em] uppercase text-inverse-muted/90">
            Covered patio size
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={patioSqftInput}
            onChange={(e) => setPatioSqftInput(e.target.value.replace(/[^\d,]/g, ""))}
            placeholder="About 300 sq ft assumed. Know yours? (optional)"
            className={approxInputClass}
            data-testid="calc-patio-sqft"
            aria-label="Approximate covered patio size in square feet (optional)"
          />
        </div>
      )}
    </div>
  );

  /* Step 4 - Upgrades (optional add-ons) */
  const chipsRow = (
    <div className="mt-5 scroll-mt-20" ref={chipsRef}>
      {renderStepLabel("upgrades", config.chipsLabel)}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        {isNewBuild
          ? "Each of these is priced separately, so ticking one moves your range. Leave them off if you are not sure yet."
          : effectiveProject === "kitchen" || effectiveProject === "bathroom"
            ? "Pick only the parts you're redoing, or leave blank for a full remodel. This adjusts your range."
            : "Select all that apply. Optional, and it helps us understand your scope."}
      </p>
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        role="group"
        aria-label={config.chipsLabel}
      >
        {config.chips
          .filter((chip) => {
            /* A chip whose answer is already settled elsewhere disappears:
               owned-land paths ask about water and sewer in the site
               questions, and plan-answered garage/basement/patio show as
               collapsed cards below rather than as tickable options. */
            if (chip.id === "well-septic" && ownsLand) return false;
            if (chip.id === "bigger-garage" && planAnsweredGarage) return false;
            if (chip.id === "basement" && planAnsweredBasement) return false;
            if (chip.id === "covered-patio" && planAnsweredPatio) return false;
            return true;
          })
          .map((chip) => {
          const Icon = chip.icon;
          const active = addOns.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleToggleChip(chip.id)}
              data-testid={`calc-chip-${chip.id}`}
              aria-pressed={active}
              className={cn(
                darkCard(active),
                "flex flex-col items-center justify-center gap-1.5 py-4 px-2 min-h-[68px] text-center",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-accent-legible" : "text-inverse-muted")} />
              <span className="text-[11.5px] tracking-[0.08em] uppercase text-inverse-foreground leading-tight">
                {chip.label}
              </span>
            </button>
          );
        })}
      </div>
      {isNewBuild && planFilledSizingCards}
      {isNewBuild && sizeFineTuning}
    </div>
  );

  /* Step 5 - Systems scope. Asked outright because it is a real cost driver
     (up to 1.22x) that used to be inferred from how many upgrade chips were
     ticked, which meant a visitor could not see it and never agreed to it. */
  const systemsRow = (
    <div className="mt-5">
      {renderStepLabel("systems", getPlumbingElectricalLabel(effectiveProject))}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        Taking a sink out and putting it back in the same spot is routine. This is about whether pipes or circuits actually change location, which is where the cost is.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {getPlumbingElectricalOptions(effectiveProject).map((opt) => {
          const active = peScope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPeScope(opt.value);
                setEdited(true);
                fireEstimatorEngagement();
              }}
              data-testid={`calc-systems-${opt.value}`}
              aria-pressed={active}
              className={cn(
                darkChoice(active),
                "py-3 px-3 min-h-[64px] flex flex-col items-center justify-center gap-0.5",
              )}
            >
              <span className="text-[13.5px] text-inverse-foreground leading-tight">{opt.label}</span>
              <span className="text-[11px] text-inverse-muted leading-tight">{opt.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Step 6 - Cabinetry tier (kitchens only). Previously assumed from the
     "Cabinets" chip; now an explicit choice. */
  const cabinetRow = (
    <div className="mt-5">
      {renderStepLabel("cabinetry", "Cabinetry")}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {([
          { value: "standard" as const, label: "Stock", sub: "Standard sizes and finishes" },
          { value: "semi-custom" as const, label: "Semi-Custom", sub: "More sizes, door styles, colors" },
          { value: "custom" as const, label: "Custom", sub: "Built to your exact space" },
        ]).map((opt) => {
          const active = cabTier === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setCabTier(opt.value);
                setEdited(true);
                fireEstimatorEngagement();
              }}
              data-testid={`calc-cabinets-${opt.value}`}
              aria-pressed={active}
              className={cn(
                darkChoice(active),
                "py-3 px-3 min-h-[64px] flex flex-col items-center justify-center gap-0.5",
              )}
            >
              <span className="text-[13.5px] text-inverse-foreground leading-tight">{opt.label}</span>
              <span className="text-[11px] text-inverse-muted leading-tight">{opt.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Whole-home: bathroom count. The published whole-home rate already assumes
     two, so this prices the difference rather than the whole thing. */
  const bathCountRow = planFilled.baths && bathCount !== null ? (
    <div className="mt-5 scroll-mt-20" ref={bathRef}>
      {renderStepLabel("bathcount", "How many bathrooms?")}
      {planFilledCard(
        "Bathrooms",
        String(bathCount),
        () => setPlanFilled((p) => ({ ...p, baths: false })),
        "calc-planfilled-baths",
      )}
    </div>
  ) : (
    <div className="mt-5 scroll-mt-20" ref={bathRef}>
      {renderStepLabel("bathcount", "How many bathrooms?")}
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/90">
        {effectiveProject === "whole-home"
          ? "Bathrooms move a whole-home budget more than any other room. Count every one in the project."
          : "A bathroom is one of the largest single line items here. Count every one included."}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {(() => {
          // The top of the range must reach at least the count the rate already
          // assumes for this home size, or a large home cannot be described
          // accurately: whole-home's assumed reference scales with area (about
          // one bath per 1,000 sq ft), so an 8,000 sq ft home assumes 8. Capping
          // the buttons at 6 there meant selecting the max still priced BELOW
          // not answering, because it read as removing two baths from the rate.
          const start = getAssumedBathrooms(effectiveProject) === 0 ? 0 : 1;
          const assumedForSize = getAssumedBathroomsForSize(effectiveProject, sqft) ?? 0;
          const max = Math.max(6, assumedForSize);
          return Array.from({ length: max - start + 1 }, (_, i) => start + i);
        })().map((n) => {
          const active = bathCount === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                setBathCount(n);
                setBathCountConfirmed(true);
                /* Tapping a count takes the answer back from the plans. */
                setPlanFilled((p) => (p.baths ? { ...p, baths: false } : p));
                fireEstimatorEngagement();
                /* Advance to the next step in sequence: kitchen if that
                   question is shown and unanswered, otherwise finish level. */
                if (showKitchenIncluded && kitchenIn === null) {
                  scheduleScroll(() => kitchenRef.current);
                } else if (!chosen.finish) {
                  scheduleScroll(() => finishRef.current);
                }
              }}
              data-testid={`calc-baths-${n}`}
              aria-pressed={active}
              className={cn(
                darkChoice(active),
                "py-3 min-h-[52px] text-[15px]",
              )}
            >
              {n === 0 ? "None" : `${n}${n === 6 ? "+" : ""}`}
            </button>
          );
        })}
      </div>
    </div>
  );

  const kitchenRow = (() => {
    const q = getKitchenQuestion(effectiveProject);
    const label = q?.isWetBar
      ? "Is there a wet bar or kitchenette?"
      : q?.isDowngrade
        ? "What kind of kitchen?"
        : "Is the kitchen part of it?";
    const opts = q?.isWetBar
      ? [
          { value: true, label: "Yes", sub: "Wet bar or kitchenette" },
          { value: false, label: "No", sub: "No sink or cabinetry down there" },
        ]
      : q?.isDowngrade
        ? [
            { value: true, label: "Full kitchen", sub: "Full-size appliances and run" },
            { value: false, label: "Kitchenette", sub: "Compact galley or efficiency" },
          ]
        : [
            { value: true, label: "Yes", sub: "Kitchen is part of the project" },
            { value: false, label: "No", sub: "Leaving the kitchen as is" },
          ];
    return (
      <div className="mt-5 scroll-mt-20" ref={kitchenRef}>
        {renderStepLabel("kitchen", label)}
        <div className="grid grid-cols-2 gap-2">
          {opts.map((opt) => {
            const active = kitchenIn === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  setKitchenIn(opt.value);
                  fireEstimatorEngagement();
                  /* Advance to the finish-level step if not yet chosen. */
                  if (!chosen.finish) {
                    scheduleScroll(() => finishRef.current);
                  }
                }}
                data-testid={`calc-kitchen-${opt.value ? "yes" : "no"}`}
                aria-pressed={active}
                className={cn(
                  darkChoice(active),
                  "py-3 px-3 min-h-[64px] flex flex-col items-center justify-center gap-0.5",
                )}
              >
                <span className="text-[13.5px] text-inverse-foreground leading-tight">{opt.label}</span>
                <span className="text-[11px] text-inverse-muted leading-tight">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  })();

  /* What we have pre-selected, stated plainly. This replaces two questions the
     visitor could not answer without a paragraph of explanation, and it reads as
     competence rather than as a form: the estimator already understands the
     project. Editing is one tap away for the minority who want it. */
  const typicalPanel = (
    <div className="mt-6 scroll-mt-20 rounded-md border border-accent-legible/30 bg-inverse-foreground/[0.05] p-4 shadow-[inset_0_0_0_1px_hsl(var(--accent-legible)/0.08)]" ref={typicalRef}>
      <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
        Typical for a {finishLabels[finish].label} {config.tabLabel.toLowerCase()}
      </p>
      <p className="mt-1 text-[12px] text-inverse-muted">
        We have pre-selected what is most common. Nothing here is locked in.
      </p>
      <ul className="mt-3 space-y-1.5">
        {typical.summary.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-inverse-muted leading-snug">
            <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-accent-legible" />
            {item}
          </li>
        ))}
      </ul>
      {bakedAssumptions.length > 0 && (
        <>
          <p className="mt-4 text-[12px] tracking-[0.1em] uppercase text-inverse-muted">
            Sizing we assumed
          </p>
          <ul className="mt-1.5 space-y-1.5" data-testid="baked-assumptions">
            {bakedAssumptions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-inverse-muted leading-snug">
                <span className="mt-0.5 text-inverse-muted/90" aria-hidden>•</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11.5px] text-inverse-muted/90 leading-relaxed">
            These are typical figures, not questions we skipped on purpose --
            your plans or a site visit refine them.
          </p>
        </>
      )}
      <button
        type="button"
        onClick={() => setEditOpen((v) => !v)}
        aria-expanded={editOpen}
        data-testid="button-edit-assumptions"
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-inverse-foreground underline underline-offset-2 hover:opacity-80"
      >
        Need to adjust anything?
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", editOpen && "rotate-180")} />
      </button>
      {editOpen && (
        <div className="mt-1">
          {showSystems && systemsRow}
          {showCabinetry && cabinetRow}
        </div>
      )}
    </div>
  );

  /* Finish level (options tied to effectiveProject) */
  /*
   * Additional structures, and the follow-ups each one opens.
   *
   * Ticking a structure is not enough to price it: a 1,600 SF cold shop with a
   * sub-panel and a 1,600 SF heated shop with a bathroom are different
   * buildings at materially different money. So each tick expands its own small
   * set of questions, and only the ones that apply - "attached" is not offered
   * for a barn, because there is no such thing.
   */
  const structuresStep = planFilled.structures ? (
    <div className="mb-6" ref={structuresRef}>
      {renderStepLabel("structures", "Any other structures?")}
      {planFilledCard(
        "Other structures",
        (structures ?? []).length > 0
          ? (structures ?? []).map((s) => ACCESSORY_STRUCTURE_LABELS[s.kind].label).join(", ")
          : "None",
        () => setPlanFilled((p) => ({ ...p, structures: false })),
        "calc-planfilled-structures",
      )}
    </div>
  ) : (
    <div className="mb-6" ref={structuresRef}>
      {renderStepLabel("structures", "Any other structures?")}
      <p className="text-[13px] text-inverse-muted -mt-1 mb-3 max-w-prose">
        Buildings other than the house. Each one is priced as its own structure,
        not as extra house square footage. Skip this if you only need the home.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {(Object.keys(ACCESSORY_STRUCTURE_LABELS) as AccessoryStructureKind[])
          .filter((kind) => {
            /*
             * A shop home IS a house with a shop: the shop area is already
             * priced from the subtype preset through refinements.shopSize.
             * Offering the shop chip as well would let a visitor add a second
             * shop that the rule set has already charged them for, and the two
             * price through different paths so nothing downstream would catch
             * the duplication.
             */
            if (kind === "shop" && effectiveProject === "shop-home") return false;
            return true;
          })
          .map((kind) => {
          const meta = ACCESSORY_STRUCTURE_LABELS[kind];
          const picked = (structures ?? []).find((s) => s.kind === kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={Boolean(picked)}
              onClick={() => toggleStructure(kind)}
              data-testid={`calc-structure-${kind}`}
              className={cn(darkChoice(Boolean(picked)), "px-3.5 py-3 text-left min-h-[54px]")}
            >
              <span className="block text-[14px] text-inverse-foreground leading-tight">
                {meta.label}
              </span>
              <span className="block text-[11.5px] text-inverse-muted mt-0.5">{meta.sub}</span>
            </button>
          );
        })}
      </div>

      {(structures ?? []).map((s) => {
        const meta = ACCESSORY_STRUCTURE_LABELS[s.kind];
        const open = openStructure === s.kind;
        return (
          <div
            key={s.kind}
            className="mt-3 rounded-md border border-accent-legible/30 bg-inverse-foreground/[0.05] p-4"
          >
            <button
              type="button"
              onClick={() => setOpenStructure(open ? null : s.kind)}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={open}
            >
              <span className="text-[14px] text-inverse-foreground">
                {meta.label} · {s.sqft.toLocaleString("en-US")} sq ft
              </span>
              <span className="text-[12px] text-accent-legible">{open ? "Done" : "Edit"}</span>
            </button>

            {open && (
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor={`as-sqft-${s.kind}`}
                    className="block text-[12px] uppercase tracking-[0.12em] text-inverse-muted mb-2"
                  >
                    Size · {s.sqft.toLocaleString("en-US")} sq ft
                  </label>
                  <input
                    id={`as-sqft-${s.kind}`}
                    type="range"
                    min={200}
                    max={s.kind === "barn" ? 6000 : 3000}
                    step={50}
                    value={s.sqft}
                    onChange={(e) => updateStructure(s.kind, { sqft: Number(e.target.value) })}
                    data-testid={`calc-structure-sqft-${s.kind}`}
                    className="w-full accent-[hsl(var(--accent-legible))]"
                  />
                </div>

                {meta.canAttach && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: false, label: "Detached" },
                      { v: true, label: "Attached to the house" },
                    ].map((o) => (
                      <button
                        key={String(o.v)}
                        type="button"
                        aria-pressed={s.attached === o.v}
                        onClick={() => updateStructure(s.kind, { attached: o.v })}
                        className={cn(darkChoice(s.attached === o.v), "px-3 py-2 text-[13px]")}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {[
                    { k: "heated" as const, label: "Heated and insulated" },
                    { k: "plumbing" as const, label: "Plumbing" },
                  ].map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      aria-pressed={s[o.k]}
                      onClick={() => updateStructure(s.kind, { [o.k]: !s[o.k] })}
                      data-testid={`calc-structure-${o.k}-${s.kind}`}
                      className={cn(darkChoice(s[o.k]), "px-3 py-2 text-[13px]")}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <div>
                  <span className="block text-[12px] uppercase tracking-[0.12em] text-inverse-muted mb-2">
                    Power
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: "none", label: "None" },
                        { v: "standard", label: "Lights and outlets" },
                        { v: "heavy", label: "Sub-panel / shop equipment" },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        aria-pressed={s.power === o.v}
                        onClick={() => updateStructure(s.kind, { power: o.v })}
                        className={cn(darkChoice(s.power === o.v), "px-3 py-2 text-[13px]")}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] uppercase tracking-[0.12em] text-inverse-muted mb-2">
                    Finish level
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={s.finish === null}
                      onClick={() => updateStructure(s.kind, { finish: null })}
                      className={cn(darkChoice(s.finish === null), "px-3 py-2 text-[13px]")}
                    >
                      Match the house
                    </button>
                    {availFinish.map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={s.finish === f}
                        onClick={() => updateStructure(s.kind, { finish: f })}
                        className={cn(darkChoice(s.finish === f), "px-3 py-2 text-[13px]")}
                      >
                        {finishLabels[f].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {structures !== null && structures.length === 0 && (
        <p className="mt-3 text-[12.5px] text-inverse-muted">
          No additional structures selected. You can add one later.
        </p>
      )}
    </div>
  );

  const planUploadStep = (
    <div className="mb-6" ref={planUploadRef}>
      {renderStepLabel("plans", "Upload your plans")}
      <p className="text-[13px] text-inverse-muted -mt-1 mb-3 max-w-prose">
        {planningStage === "have-plans"
          ? "We will read them and fill in most of the questions below for you -- size, bathrooms and other structures stop being questions and start being facts. It also tightens your range."
          : "Even a working set helps. We will read what is settled and leave the rest to you."}{" "}
        The cover sheet, floor plans and elevations are the most useful pages.
        Optional -- you can skip this and answer the questions instead.
      </p>

      <label
        className={cn(
          darkChoice(false),
          "flex items-center justify-center gap-3 px-4 py-6 cursor-pointer text-center",
          planBusy && "opacity-60 pointer-events-none",
        )}
      >
        <input
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          disabled={planBusy}
          data-testid="calc-plan-upload"
          onChange={(e) => {
            void handlePlanUpload(e.target.files);
            // Cleared so re-picking the same file fires change again.
            e.target.value = "";
          }}
        />
        <span className="text-[14px] text-inverse-foreground">
          {planBusy ? "Uploading and reading your plans..." : "Choose files"}
        </span>
        <span className="text-[12px] text-inverse-muted">{READABLE_FORMATS_LABEL}</span>
      </label>
      {planBusy && (
        <p className="mt-2 text-[12px] text-inverse-muted" role="status" data-testid="calc-plan-busy">
          This usually takes under half a minute. Your files are saved either way.
        </p>
      )}

      {planStored.length > 0 && (
        <p className="mt-2 text-[12px] text-inverse-muted" data-testid="calc-plan-stored">
          Attached: {planStored.map((f) => f.filename).join(", ")}
        </p>
      )}

      {planError && (
        <p
          className={cn(
            "mt-3 text-[13px] rounded-md px-3 py-2.5",
            planIsRemodel
              ? "text-inverse-foreground bg-accent/10 border border-accent-legible/40"
              : "text-inverse-muted bg-inverse-foreground/[0.06] border border-accent-legible/20",
          )}
          role="status"
          data-testid="calc-plan-error"
        >
          {planError}
        </p>
      )}

      {planApplied && planApplied.length > 0 && (
        <div
          className="mt-3 rounded-md border border-accent-legible/40 bg-accent/10 px-3.5 py-3"
          role="status"
          data-testid="calc-plan-applied"
        >
          <p className="text-[12px] uppercase tracking-[0.12em] text-accent-legible mb-2">
            Read from your plans
          </p>
          <ul className="space-y-1">
            {planApplied.map((line) => (
              <li key={line} className="text-[13px] text-inverse-foreground">
                {line}
              </li>
            ))}
          </ul>
          {planUnderstood.length > 0 && (
            <>
              <p className="mt-3 text-[12px] uppercase tracking-[0.12em] text-inverse-muted mb-1.5">
                Also read from your plans
              </p>
              <p className="text-[12px] text-inverse-muted leading-relaxed" data-testid="calc-plan-understood">
                {planUnderstood.join(" · ")}
              </p>
            </>
          )}
          {planChanged.length > 0 && (
            <div className="mt-3 rounded-sm border border-accent-legible/50 bg-accent/15 px-3 py-2.5" data-testid="calc-plan-changed">
              <p className="text-[12px] uppercase tracking-[0.12em] text-accent-legible mb-1.5">
                Changed from your earlier answers
              </p>
              <ul className="space-y-1">
                {planChanged.map((line) => (
                  <li key={line} className="text-[13px] text-inverse-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2.5 text-[12px] text-inverse-muted">
            Review what we filled in, then continue below -- anything the plans
            answered shows as pre-filled with an Edit link, and everything is
            still yours to change.
          </p>
        </div>
      )}

      {planUnresolved.length > 0 && (
        <ul className="mt-2 space-y-1" data-testid="calc-plan-unresolved">
          {planUnresolved.map((line) => (
            <li key={line} className="text-[12px] text-inverse-muted">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const finishRow = (
    <div className="mt-5 scroll-mt-20" ref={finishRef}>
      {renderStepLabel("finish", "Finish level")}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {availFinish.map((level) => {
          const active = chosen.finish && finish === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelectFinish(level)}
              data-testid={`calc-finish-${level}`}
              aria-pressed={active}
              className={cn(
                darkChoice(active),
                "py-3 px-2 min-h-[64px] flex flex-col items-center justify-center gap-0.5",
              )}
            >
              {/* Finish is the single biggest price driver (roughly 2x per tier),
                  so it gets the same explanatory subtitle the other cards have. */}
              <span className="text-[13.5px] text-inverse-foreground leading-tight">
                {finishLabels[level].label}
              </span>
              <span className="text-[11px] text-inverse-muted leading-tight">
                {finishLabels[level].sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Live planning range - always visible, updates as selections change */
  const resultPanel = (
    <div className="mt-8 scroll-mt-20" ref={resultRef} aria-live="polite" aria-atomic="true">
      <div className="space-y-5 border-t border-inverse-foreground/15 pt-6">
          {/* Price range */}
          <div>
            <p className="text-[12px] tracking-[0.14em] uppercase text-inverse-muted mb-2">
              Your planning range
            </p>
            <div
              className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(32px,8vw,52px)]"
              data-testid="estimate-range"
            >
              {formatPlanningCurrency(result.priceLow)}
              <span className="text-inverse-muted/90 mx-2 text-xl">to</span>
              {formatPlanningCurrency(result.priceHigh)}
            </div>
            {/* Resale return is a remodeling measure: it compares what you spent
                against what it added to a house that already existed. A new home
                has no "before", so there is nothing to express a percentage
                against and quoting one would be inventing a claim. New
                construction carries roi: 0 in PRICE_MATRIX for exactly this
                reason, and the line is hidden rather than showing "about 0%". */}
            {result.roi > 0 ? (
              <p className="mt-2.5 text-[14px] text-inverse-muted">
                Typical resale return for this project type: about {result.roi}%.
              </p>
            ) : (
              <div className="mt-2.5 space-y-1" data-testid="range-included-excluded">
                <p className="text-[13.5px] text-inverse-muted leading-relaxed">
                  <span className="text-inverse-foreground/90">Includes:</span>{" "}
                  the home and attached garage, foundation and site work,
                  complete plumbing, electrical and HVAC, driveway, walkways and
                  front-yard landscaping.
                </p>
                <p className="text-[13.5px] text-inverse-muted leading-relaxed">
                  <span className="text-inverse-foreground/90">Excludes:</span>{" "}
                  land, appliances, impact and utility connection fees, and
                  landscaping beyond the front yard -- full list below.
                </p>
                {(refinements.accessoryStructures?.length ?? 0) > 0 && (
                  <p className="text-[12.5px] text-inverse-muted/90 leading-relaxed" data-testid="accessory-allowance-note">
                    Detached structures in this range are priced as a rough
                    market allowance, not builder-verified pricing -- they are
                    the least firm part of this number until we see the site.
                  </p>
                )}
              </div>
            )}
            {/* Always visible, never behind a toggle: a homeowner must not be
                able to leave this screen thinking they were given a price. */}
            <p className="mt-3 text-[12.5px] text-inverse-foreground/90 leading-relaxed font-normal">
              {NOT_A_QUOTE_NOTICE}
            </p>
            <p className="mt-1.5 text-[12.5px] text-inverse-muted/90 leading-relaxed">
              {/* Project-aware: a new-home build gets the lot-and-site version, not
                  the remodel "what is behind the walls" line. The email already
                  branched here; the on-page panel did not, so a custom-home
                  estimate was showing remodel language at the very bottom. */}
              {getOnsiteNotice(effectiveProject)}
            </p>
          </div>

          {/* THE ANSWER TO THE BUDGET ASKED IN THE GATE. There is no second
              input here: the homeowner has already given us the number, and
              asking again would read as though we had not been listening.
              This block is the reply, and it re-solves itself whenever they
              change a selection above. */}
          {budgetAssessment && (
            <div className="border-t border-inverse-foreground/10 pt-4">
              <div className="rounded-sm bg-inverse-foreground/[0.06] border border-inverse-foreground/12 p-4" data-testid="budget-assessment">
                <p className="text-[14px] text-inverse-foreground leading-relaxed">
                  {budgetAssessment.headline}
                </p>
                {budgetAssessment.driver && (
                  <p className="mt-1.5 text-[13px] text-inverse-muted leading-relaxed">
                    {budgetAssessment.driver}
                  </p>
                )}
                {budgetGuidance(budgetAssessment) && (
                  <p className="mt-2.5 text-[13.5px] text-inverse-foreground leading-relaxed">
                    {budgetGuidance(budgetAssessment)}
                  </p>
                )}
                {budgetAssessment.options.length > 1 && (
                  <ul className="mt-3 space-y-1.5">
                    {budgetAssessment.options.slice(1).map((o) => (
                      <li key={o.label} className="text-[13px] text-inverse-muted leading-relaxed">
                        {/* Full dollars, not the compact form used for the
                            headline range: this list sits directly under a
                            sentence written in full dollars, and mixing
                            "$19,000" with "$19k" two lines apart reads as two
                            different numbers. */}
                        Or {o.label}: ${o.low.toLocaleString("en-US")} to $
                        {o.high.toLocaleString("en-US")}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[12px] text-inverse-muted/90 leading-relaxed">
                  {BUDGET_BASIS_NOTE}
                </p>
              </div>
            </div>
          )}

          {/* Scope accordion */}
          <div className="border-t border-inverse-foreground/10 pt-4">
            <button
              type="button"
              onClick={() => setScopeOpen((p) => !p)}
              className="flex w-full items-center justify-between text-left"
              data-testid="button-toggle-scope"
              aria-expanded={scopeOpen}
            >
              <span className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
                What&apos;s typically included ({result.included.length})
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-inverse-muted transition-transform", scopeOpen && "rotate-180")}
              />
            </button>
            {scopeOpen && (
              <div className="pt-3 space-y-2">
                {result.included.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-[13.5px] text-inverse-muted leading-snug"
                    data-testid={`included-item-${i}`}
                  >
                    <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-accent-legible" />
                    {item}
                  </div>
                ))}
                <p className="text-[12px] text-inverse-muted/90 pt-1.5 leading-relaxed">
                  {INCLUDED_SCOPE_NOTE}
                </p>
                {effectiveProject === "kitchen" && (
                  <p className="text-[12px] text-inverse-muted/90 leading-relaxed">
                    {APPLIANCE_DISCLAIMER}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Scope breakdown. Collapsed by default: most homeowners want the
              range, and the ones who want to know what is behind it get the
              trades and quantities it was built from. Deliberately no per-line
              dollars - see TAKEOFF_SCOPE_NOTICE. */}
          <div className="border-t border-inverse-foreground/10 pt-4">
            <button
              type="button"
              onClick={() => setTakeoffOpen((p) => !p)}
              className="flex w-full items-center justify-between text-left"
              data-testid="button-toggle-takeoff"
              aria-expanded={takeoffOpen}
            >
              <span className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
                The work this range covers
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-inverse-muted transition-transform", takeoffOpen && "rotate-180")}
              />
            </button>
            {takeoffOpen && (() => {
              // Clients never see PM or overhead itemized; those dollars are
              // folded proportionally into the visible lines (same total).
              const takeoff = takeoffForClient(
                takeoffForRange(
                  effectiveProject,
                  finish,
                  sqft,
                  result.priceLow,
                  result.priceHigh,
                  unitCostOverrides,
                ),
              );
              const group = (g: "direct" | "soft") =>
                takeoff.lines.filter((l) => l.group === g && l.cost > 0);
              const groupLabel = "text-[11.5px] tracking-[0.1em] uppercase text-inverse-muted/90 pt-2.5 pb-1";
              // Scope and quantities only. Per-line dollars were removed from
              // every lead-facing surface: they are proportional allocations of
              // a validated total, not priced quantities, so showing them
              // claimed a precision the model does not have and created a
              // negotiating anchor before anyone had seen the house. See
              // TAKEOFF_SCOPE_NOTICE.
              const row = (l: (typeof takeoff.lines)[number]) => {
                const qty = formatQuantity(l);
                return (
                  <div
                    key={l.id}
                    className="text-[13.5px] text-inverse-muted leading-snug py-1"
                    data-testid={`takeoff-line-${l.id}`}
                  >
                    <span>
                      {l.label}
                      {qty && <span className="text-inverse-muted/90"> ({qty})</span>}
                    </span>
                  </div>
                );
              };
              return (
                <div className="pt-2">
                  <p className={groupLabel}>The work</p>
                  {group("direct").map(row)}
                  <p className={groupLabel}>Running the job</p>
                  {group("soft").map(row)}
                  <p className="text-[12px] text-inverse-muted/90 pt-3 leading-relaxed">
                    {TAKEOFF_SCOPE_NOTICE}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Exclusions, assumptions and cost drivers. Collapsed so the panel
              stays scannable, but the content is complete and comes from the
              same source as the confirmation email. */}
          <div className="border-t border-inverse-foreground/10 pt-4">
            <button
              type="button"
              onClick={() => setLimitsOpen((p) => !p)}
              className="flex w-full items-center justify-between text-left"
              data-testid="button-toggle-limits"
              aria-expanded={limitsOpen}
            >
              <span className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
                What&apos;s not included &amp; what could change it
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-inverse-muted transition-transform", limitsOpen && "rotate-180")}
              />
            </button>
            {limitsOpen && (
              <div className="pt-3 space-y-5">
                <div>
                  <p className="text-[12px] tracking-[0.1em] uppercase text-inverse-muted mb-2">
                    Not included
                  </p>
                  <ul className="space-y-1.5">
                    {disclosure.excludes.map((item, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\00d7'] before:absolute before:left-0 before:text-inverse-muted/90"
                        data-testid={`excluded-item-${i}`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.1em] uppercase text-inverse-muted mb-2">
                    What we assumed
                  </p>
                  <ul className="space-y-1.5">
                    {disclosure.assumptions.map((item, i) => (
                      <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2022'] before:absolute before:left-0 before:text-inverse-muted/90">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[12px] tracking-[0.1em] uppercase text-inverse-muted mb-2">
                      Could raise the cost
                    </p>
                    <ul className="space-y-1.5">
                      {disclosure.increases.map((item, i) => (
                        <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2191'] before:absolute before:left-0 before:text-inverse-muted/90">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[12px] tracking-[0.1em] uppercase text-inverse-muted mb-2">
                      Could lower the cost
                    </p>
                    <ul className="space-y-1.5">
                      {disclosure.decreases.map((item, i) => (
                        <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2193'] before:absolute before:left-0 before:text-inverse-muted/90">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.1em] uppercase text-inverse-muted mb-2">
                    Optional upgrades that add cost
                  </p>
                  <ul className="space-y-1.5">
                    {disclosure.upgrades.map((item, i) => (
                      <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\002b'] before:absolute before:left-0 before:text-inverse-muted/90">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Legal */}
          <div>
            <button
              type="button"
              onClick={() => setLegalOpen((p) => !p)}
              className="flex items-center gap-1.5 text-[12px] text-inverse-muted/90 hover:text-inverse-muted transition-colors"
              aria-expanded={legalOpen}
            >
              Why a range, not a fixed price?
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", legalOpen && "rotate-180")} />
            </button>
            {legalOpen && (
              <p className="text-[12px] text-inverse-muted/90 leading-relaxed mt-2">
                Planning estimate only, not a proposal, bid, or guaranteed cost. Ranges reflect
                project type, size, location, and finish assumptions. Your consultation delivers a
                detailed evaluation tailored to your home.
              </p>
            )}
          </div>

          {/* Who we already have on file. Shown once the visitor has passed the
              gate so the estimator is theirs to use freely: they can keep
              changing selections without being asked again, correct what we
              hold, or send us the revised numbers. */}
          {savedIdentity?.email && (
            <div className="rounded-md border border-inverse-foreground/[0.12] bg-inverse-foreground/[0.04] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-inverse-muted">
                    Saved on this device, so you can keep exploring without re-entering anything
                  </p>
                  <p className="text-[13.5px] text-inverse-foreground mt-0.5 truncate">
                    {savedIdentity.name}
                    {savedIdentity.email ? ` · ${savedIdentity.email}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleEditIdentity}
                    data-testid="button-edit-identity"
                    className="text-[12px] text-inverse-foreground underline underline-offset-2 hover:opacity-80"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleForgetIdentity}
                    data-testid="button-forget-identity"
                    className="text-[12px] text-inverse-muted hover:text-inverse-foreground"
                  >
                    Not you?
                  </button>
                </div>
              </div>

              {/* Resubmitting is only meaningful once something has actually
                  changed, so the prompt appears rather than sitting there
                  inviting duplicate leads. */}
              {hasUnsentChanges && resendState !== "sent" && (
                <div className="mt-3 pt-3 border-t border-inverse-foreground/10">
                  <p className="text-[12px] text-inverse-muted mb-2">
                    You have changed your project since we last heard from you.
                  </p>
                  <Button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === "sending"}
                    data-testid="button-resend-estimate"
                    variant="brandOutline"
                    className="h-10 text-[12.5px] tracking-[0.08em] uppercase"
                  >
                    {resendState === "sending" ? "Sending…" : "Send us my updated estimate"}
                  </Button>
                  {resendState === "error" && (
                    <p className="text-[12px] text-destructive mt-2">
                      That did not go through. Please try again.
                    </p>
                  )}
                </div>
              )}

              {resendState === "sent" && (
                <p className="mt-3 pt-3 border-t border-inverse-foreground/10 text-[12px] text-accent-legible">
                  Sent. We have your updated numbers and will follow up on these.
                </p>
              )}
            </div>
          )}

          {/* Single primary CTA - book the free visit (recommended next step) */}
          <Button
            onClick={handleBookVisit}
            data-testid="button-book-visit"
            className="w-full h-14 bg-inverse-foreground text-inverse hover:bg-inverse-foreground/90 text-[14px] tracking-[0.12em] uppercase"
          >
            Book Free Visit
            <ArrowRight className="h-4 w-4" />
          </Button>
      </div>
    </div>
  );

  /* CTA shown after user configures their estimate -- clicking opens the gate form */
  const calculateCta = (
    <div className="mt-8 scroll-mt-20 border-t border-inverse-foreground/15 pt-6" ref={ctaAreaRef}>
      <Button
        type="button"
        onClick={() => setGateOpen(true)}
        data-testid="button-get-estimate"
        className="w-full h-14 bg-inverse-foreground text-inverse text-[14px] tracking-[0.12em] uppercase"
      >
        Get My Estimate Range
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-[12px] text-inverse-muted/90 text-center mt-3 leading-relaxed">
        Takes 30 seconds. We will email you a copy too.
      </p>
    </div>
  );

  /* Lead-gate panel - shown in place of the result until contact info is submitted */
  const subtypeTitle =
    config.subtypes.find((s) => s.id === subtype)?.title ?? config.tabLabel;

  const leadsGatePanel = (
    <div className="mt-8 scroll-mt-20 border-t border-inverse-foreground/15 pt-6" ref={gateFormRef} aria-label="Unlock your estimate">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-legible/20">
            <Lock className="h-4 w-4 text-accent-legible" />
          </div>
          <div>
            <p className="text-[18px] font-light text-inverse-foreground leading-tight">
              Your estimate is ready
            </p>
            <p className="text-[13px] text-inverse-muted mt-0.5">
              Tell us where to send it -- we show it here and email you a copy.
              Your details go to our team, never to lists or third parties.
            </p>
          </div>
        </div>

        {/* Project summary chips */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-inverse-foreground/[0.08] border border-inverse-foreground/15 text-[11.5px] text-inverse-foreground">
            {config.tabLabel}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-inverse-foreground/[0.08] border border-inverse-foreground/15 text-[11.5px] text-inverse-foreground">
            {subtypeTitle}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-inverse-foreground/[0.08] border border-inverse-foreground/15 text-[11.5px] text-inverse-foreground">
            {finishLabels[finish].label}
          </span>
        </div>

        {/* Blurred price teaser */}
        <div className="relative select-none">
          <div
            className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(32px,8vw,52px)] blur-sm pointer-events-none"
            aria-hidden="true"
          >
            {formatPlanningCurrency(result.priceLow)}
            <span className="text-inverse-muted/90 mx-2 text-xl">to</span>
            {formatPlanningCurrency(result.priceHigh)}
          </div>
          <div className="absolute inset-0 flex items-center">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-inverse-muted bg-inverse px-3 py-1.5 rounded-full border border-inverse-foreground/15">
              <Lock className="h-3 w-3" />
              Enter your info to unlock
            </span>
          </div>
        </div>

        {/* Contact form */}
        <form onSubmit={handleGateSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="First name"
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
            required
            minLength={2}
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-name"
            aria-label="First name"
            autoComplete="given-name"
          />
          <input
            type="email"
            placeholder="Email address"
            value={gateEmail}
            onChange={(e) => setGateEmail(e.target.value)}
            required
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-email"
            aria-label="Email address"
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={gatePhone}
            onChange={(e) => setGatePhone(e.target.value)}
            required
            minLength={10}
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-phone"
            aria-label="Phone number"
            autoComplete="tel"
          />

          {/* Location was collected earlier in the flow: the property address
              for landowners, the planned build area for everyone else. Show a
              read-only confirmation when already filled; when skipped, show a
              minimal fallback input so the visitor can still submit without
              scrolling back up. Never a street-address prompt for land the
              visitor does not own. */}
          {ownsLand ? (
            gateAddress.trim() ? (
              <div className="rounded-md border border-inverse-foreground/15 bg-inverse-foreground/[0.04] px-4 py-3">
                <p className="text-[11px] text-inverse-muted/90 mb-0.5 uppercase tracking-wide">Property address</p>
                <p className="text-[13.5px] text-inverse-foreground leading-snug">{gateAddress}</p>
                <p className="mt-1 text-[11px] text-inverse-muted/90">Scroll up to the address step to update.</p>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Property address (house number + street)"
                  value={gateAddress}
                  onChange={(e) => setGateAddress(e.target.value)}
                  className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
                  data-testid="gate-input-address"
                  aria-label="Property address"
                  autoComplete="street-address"
                />
                <p className="mt-1.5 text-[11.5px] text-inverse-muted/90">
                  So we can confirm we serve your area and check county records before your visit.
                </p>
              </div>
            )
          ) : buildArea.trim() ? (
            <div className="rounded-md border border-inverse-foreground/15 bg-inverse-foreground/[0.04] px-4 py-3">
              <p className="text-[11px] text-inverse-muted/90 mb-0.5 uppercase tracking-wide">Planned build area</p>
              <p className="text-[13.5px] text-inverse-foreground leading-snug">{buildArea}</p>
              <p className="mt-1 text-[11px] text-inverse-muted/90">Scroll up to the build-area step to update.</p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="City or area you plan to build in"
                value={buildArea}
                onChange={(e) => setBuildArea(e.target.value)}
                maxLength={120}
                className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
                data-testid="gate-input-build-area"
                aria-label="City or area you plan to build in"
              />
              <p className="mt-1.5 text-[11.5px] text-inverse-muted/90">
                So we can confirm we serve the area you are headed to.
              </p>
            </div>
          )}
          {/* THE ONE BUDGET ASK. Asked here, before the range, so the estimate
              we hand back can be framed against it straight away and so the
              team has a real number for every lead who gets this far, not only
              the ones who go on to book a visit.

              A number rather than a bracket: "$25,000 - $50,000" is too coarse
              to solve against, and the trade-off engine needs an actual figure
              to test selections at. Optional, and never a condition of seeing
              the range - an extra required field here reads as a
              bait-and-switch. */}
          <div>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-inverse-muted/90"
                aria-hidden="true"
              >
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value.replace(/[^\d,]/g, ""))}
                placeholder="Budget you are working toward (optional)"
                /* 16px: iOS Safari zooms the page when a focused input renders
                   below 16px and does not zoom back out. */
                className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md pl-8 pr-4 py-3 text-[16px] text-inverse-foreground placeholder:text-[14px] placeholder:text-inverse-muted/90 outline-none focus:border-inverse-foreground/50 transition-colors"
                data-testid="gate-input-budget"
                aria-label="Budget you are working toward (optional)"
                aria-describedby="brc-gate-budget-help"
              />
            </div>
            <p id="brc-gate-budget-help" className="mt-1.5 text-[11.5px] text-inverse-muted/90">
              If you share it, we will show you what fits and what to change if it does not.
              It never changes what we charge.
            </p>
          </div>
          {gateError && (
            // role="alert" so a screen reader announces the validation message
            // the moment it appears; native required-field errors are announced
            // by the browser, but these format checks are ours to surface.
            <p role="alert" className="text-[12px] text-red-400">{gateError}</p>
          )}
          <Button
            type="submit"
            disabled={gateLoading}
            data-testid="button-gate-submit"
            className="w-full h-14 bg-inverse-foreground text-inverse text-[14px] tracking-[0.12em] uppercase"
          >
            {gateLoading ? "Sending..." : "Reveal My Estimate"}
            {!gateLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
          <p className="text-[12px] text-inverse-muted/90 text-center leading-relaxed">
            We will email you a copy too. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );

  /* ══════════════════════════════
     LAYOUTS
  ══════════════════════════════ */

  /* Ordered input flow. Size / upgrades / finish reveal once a layout is chosen
     so the form grows naturally (no dead space, minimal scrolling). */
  const flow = (
    <>
      {intro}
      {/* Planning stage comes before the project grid: it is the question a
          builder actually asks first, and it decides how wide the resulting
          range can honestly be. */}
      {planningStageStep}
      {/* Each step appears only once the one before it has been answered, so a
          visitor is never presented with a pre-filled choice they did not make
          and cannot reach an estimate without selecting every input. */}
      {chosen.stage && showPlanUpload && planUploadStep}
      {/* Land ownership is a situation, not a project type, so it is asked
          before the home itself and reshapes what follows. */}
      {chosen.stage && landStep}
      {chosen.land && projectGrid}
      {/* Street address + property lookup for landowners; a light build-area
          question for everyone else. */}
      {chosen.project && (ownsLand ? addressStep : areaStep)}
      {chosen.project && subtypeGrid}
      {chosen.subtype && sizeGrid}
      {/* Site conditions, only when the visitor already owns the land. */}
      {chosen.subtype && ownsLand && isNewConstructionProject(effectiveProject) && siteSection}
      {chosen.subtype && chipsRow}
      {chosen.subtype && showBathCount && bathCountRow}
      {chosen.subtype && showKitchenIncluded && kitchenRow}
      {chosen.subtype && structuresStep}
      {chosen.subtype && finishRow}
      {chosen.finish && typicalPanel}
      {allChosen &&
        (gateSubmitted ? resultPanel : gateOpen ? leadsGatePanel : calculateCta)}
    </>
  );

  /* inModal: compact card without full-viewport constraint */
  if (inModal) {
    return (
      <div className="relative bg-inverse text-inverse-foreground rounded-lg p-5 sm:p-6">
        {flow}
        <StickyEstimateBar
          mode="modal"
          result={allChosen ? result : null}
          summary={stickySummary}
          ctaLabel={gateSubmitted ? "Book Free Visit" : allChosen ? "Get My Range" : "Continue"}
          onCta={handleStickyCta}
        />
      </div>
    );
  }

  /* Full page: dark section that sizes to its content (no forced viewport height,
     no footer banner, no dead space below the form). */
  return (
    <>
      <Section
        id="calculator"
        variant="inverse"
        divider
        className="scroll-mt-16 relative overflow-hidden border-y-2 border-accent-legible/40"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-accent-legible z-10" aria-hidden />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-accent-legible/15" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.028]"
          style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat" }}
          aria-hidden
        />
        <div ref={sectionRef} className="container px-4 sm:px-6 py-2 md:py-4 relative z-[1]">
          <div className="mx-auto w-full max-w-5xl">
            <div className="relative rounded-sm border border-accent-legible/45 bg-inverse-foreground/[0.04] shadow-[0_0_0_1px_hsl(var(--accent-legible)/0.1),0_24px_60px_-20px_rgba(0,0,0,0.55)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-accent-legible/80 rounded-l-sm" aria-hidden />
              <div
                className="absolute inset-x-6 sm:inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-legible/50 to-transparent"
                aria-hidden
              />
              <div className="relative px-5 sm:px-7 md:px-9 py-8 md:py-10 lg:py-12">{flow}</div>
            </div>
          </div>
        </div>
      </Section>
      <StickyEstimateBar
        mode="inline"
        visible={sectionVisible}
        result={allChosen ? result : null}
        summary={stickySummary}
        ctaLabel={gateSubmitted ? "Book Free Visit" : allChosen ? "Get My Range" : "Continue"}
        onCta={handleStickyCta}
      />
    </>
  );
}
