"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check, ChevronDown, ArrowRight, Lock,
  UtensilsCrossed, Droplets, Home, Building2, Layers, AlignLeft,
  LayoutGrid, Star, Sun, Monitor, Dumbbell, Bed, Car,
  Lightbulb, Wind, DoorOpen, GlassWater, Sofa, Frame, Triangle, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  takeoffForRange,
  formatQuantity,
  formatTakeoffAmount,
  TAKEOFF_BASIS_NOTICE,
  type UnitCostOverrides,
} from "@/shared/costCatalog";
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
  getKitchenQuestion,
  getTypicalSelections,
  FINISH_LABELS as ENGINE_FINISH_LABELS,
  PROJECT_SIZE_CONFIG,
  formatPlanningCurrency,
  calculateEstimate,
  buildStoredEstimate,
  countVisibleUserRefinements,
  getSetRefinementKeys,
  INCLUDED_SCOPE_NOTE,
  buildEstimateDisclosure,
  NOT_A_QUOTE_NOTICE,
  ONSITE_REQUIRED_NOTICE,
  APPLIANCE_DISCLAIMER,
} from "@/shared/estimateEngine";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
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

/** Budget ranges shown in the gate form, calibrated per project type. */
const BUDGET_RANGES: Record<ProjectType, string[]> = {
  kitchen: [
    "Under $25,000",
    "$25,000 - $50,000",
    "$50,000 - $100,000",
    "$100,000 - $150,000",
    "Over $150,000",
  ],
  bathroom: [
    "Under $15,000",
    "$15,000 - $30,000",
    "$30,000 - $60,000",
    "$60,000 - $100,000",
    "Over $100,000",
  ],
  "whole-home": [
    "Under $100,000",
    "$100,000 - $200,000",
    "$200,000 - $400,000",
    "$400,000 - $600,000",
    "Over $600,000",
  ],
  addition: [
    "Under $75,000",
    "$75,000 - $150,000",
    "$150,000 - $300,000",
    "Over $300,000",
  ],
  adu: [
    "Under $150,000",
    "$150,000 - $250,000",
    "$250,000 - $400,000",
    "Over $400,000",
  ],
  basement: [
    "Under $40,000",
    "$40,000 - $75,000",
    "$75,000 - $150,000",
    "Over $150,000",
  ],
};

const PROJECT_TYPE_ORDER: ProjectType[] = [
  "kitchen", "bathroom", "whole-home", "addition", "adu", "basement",
];

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
function buildRefinements(
  effectiveProject: ProjectType,
  _subtype: string,
  addOns: string[],
  subtypeRef: Partial<EstimateRefinements>,
  plumbingElectrical: PlumbingElectrical | null,
  cabinetTier: CabinetTier | null,
  bathroomCount: number | null,
  kitchenIncluded: boolean | null,
): EstimateRefinements {
  const ref: EstimateRefinements = { ...EMPTY_REFINEMENTS, ...subtypeRef };

  if (effectiveProject === "whole-home" && addOns.includes("layout")) {
    ref.layoutChanges = "moderate";
  }

  if (plumbingElectrical) ref.plumbingElectrical = plumbingElectrical;
  if (cabinetTier && effectiveProject === "kitchen") ref.cabinetTier = cabinetTier;

  if (bathroomCount !== null) ref.bathroomCount = bathroomCount;
  if (kitchenIncluded !== null) ref.kitchenIncluded = kitchenIncluded;

  return ref;
}

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════ */

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
  const [activeProject, setActiveProject] = useState<ProjectType>("kitchen");
  const [subtype, setSubtype]             = useState<string>(() => defaultSubtypeFor("kitchen"));
  const [sqft, setSqft]                   = useState<number>(
    () => SUBTYPE_DATA.kitchen[defaultSubtypeFor("kitchen")].sqft,
  );
  const [addOns, setAddOns]               = useState<string[]>([]);
  const [finish, setFinish]               = useState<FinishLevel>("mid-range");
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
  const [kitchenIn, setKitchenIn] = useState<boolean | null>(null);
  /* True once the visitor overrides a pre-selected value, after which the
     profile stops overwriting their choice. */
  const [edited, setEdited] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chosen, setChosen] = useState({ project: false, subtype: false, finish: false });
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
  const [gateBudget,    setGateBudget]    = useState("");
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

  /* ── Derived ── */
  const config = PROJECT_CONFIGS[activeProject];

  const effectiveProject = useMemo<ProjectType>(
    () => SUBTYPE_DATA[activeProject]?.[subtype]?.projectOverride ?? activeProject,
    [activeProject, subtype],
  );

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
    if (!data) return { ...EMPTY_REFINEMENTS };
    return buildRefinements(effectiveProject, subtype, addOns, data.refinements, peScope, cabTier, bathCount, kitchenIn);
  }, [effectiveProject, activeProject, subtype, addOns, peScope, cabTier, bathCount, kitchenIn]);

  const userRefinementCount = useMemo(
    () => countVisibleUserRefinements(effectiveProject, getSetRefinementKeys(refinements)),
    [effectiveProject, refinements],
  );

  const result = useMemo<EstimateResult>(() => {
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    return calculateEstimate(input, userRefinementCount);
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

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

  /* ── Persist to sessionStorage (live, on every change) ── */
  useEffect(() => {
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify({
        ...buildStoredEstimate(input, userRefinementCount),
        // Carried alongside the engine result so the consultation form can
        // forward the visitor's literal choices to the emails. Without these
        // the emails could only show derived values (for example "moderate
        // layout changes") and never the card the visitor actually clicked.
        layoutLabel: selectedLayoutLabel,
        upgradeLabels: selectedUpgradeLabels,
      }),
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

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

  /* Reset budget selection when the project type changes (ranges differ per project). */
  useEffect(() => {
    setGateBudget("");
  }, [effectiveProject]);

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
      content_category: "remodel_estimate",
    });
    trackEvent("begin_checkout", { project: effectiveProject });
  }

  function handleSelectProject(type: ProjectType) {
    if (type === activeProject && chosen.project) return;
    const sub = defaultSubtypeFor(type);
    setActiveProject(type);
    setSubtype(sub);
    setSqft(SUBTYPE_DATA[type][sub].sqft);
    setAddOns([]);
    const avail = getAvailableFinishLevels(type);
    if (!avail.includes(finish)) setFinish("mid-range");
    setPeScope(null);
    setCabTier(null);
    setBathCount(null);
    setKitchenIn(null);
    // Changing the project invalidates the layout and finish choices made under
    // the previous one, so the visitor picks those again rather than inheriting.
    setChosen({ project: true, subtype: false, finish: false });
    fireEstimatorEngagement();
  }

  /* Selecting a layout sets a smart default size, which the slider fine-tunes. */
  function handleSelectSubtype(id: string) {
    setSubtype(id);
    setChosen((p) => ({ ...p, subtype: true }));
    const data = SUBTYPE_DATA[activeProject]?.[id];
    if (data) {
      const c = PROJECT_SIZE_CONFIG[data.projectOverride ?? activeProject];
      setSqft(Math.max(c.min, Math.min(c.max, data.sqft)));
    }
    fireEstimatorEngagement();
  }

  function handleSelectFinish(level: FinishLevel) {
    setFinish(level);
    setChosen((p) => ({ ...p, finish: true }));
    fireEstimatorEngagement();
  }

  function handleToggleChip(id: string) {
    setAddOns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    fireEstimatorEngagement();
  }

  function handleSqft(value: number) {
    setSqft(value);
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
    kitchen: ["counters", "lighting"],
    bathroom: ["shower", "vanity", "tub"],
    "whole-home": ["kitchen", "baths", "layout"],
    addition: [],
    adu: [],
    basement: ["bath", "wet-bar", "egress"],
  };
  /* New construction always carries its own systems, whatever else is ticked. */
  const ALWAYS_HAS_SYSTEMS: ProjectType[] = ["addition", "adu"];

  const showCabinetry = effectiveProject === "kitchen" && addOns.includes("cabinets");
  /* Bathrooms drive a whole-home budget more than anything else, so the count is
     asked whenever baths are in scope. With no chips ticked the scope is still
     unknown and a whole-home almost always includes baths, so it is asked then
     too. The kitchen question appears the same way. */
  const showBathCount = getAssumedBathrooms(effectiveProject) !== null;
  const showKitchenIncluded = getKitchenQuestion(effectiveProject) !== null;
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

  /* Numbers are derived, never hardcoded, so a hidden step cannot leave a gap
     in the sequence the visitor reads. */
  const visibleSteps: string[] = [
    "project",
    "layout",
    "size",
    "upgrades",
    ...(showBathCount ? ["bathcount"] : []),
    ...(showKitchenIncluded ? ["kitchen"] : []),
    "finish",
  ];
  const stepNo = (id: string) => visibleSteps.indexOf(id) + 1;

  /* Only the things a homeowner actually knows are required: their project,
     layout, size, finish, bathroom count and whether the kitchen is in scope.
     Cabinetry and systems scope are pre-selected from the finish profile, so
     they always hold a value and never block completion. */
  const allChosen =
    chosen.project &&
    chosen.subtype &&
    chosen.finish &&
    (!showBathCount || bathCount !== null) &&
    (!showKitchenIncluded || kitchenIn !== null);

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
    if (!gateAddress.trim() || !HOUSE_NUMBER_REGEX.test(gateAddress.trim())) {
      setGateError("Please enter your property address, including the house number.");
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
      address: gateAddress.trim(),
      zip: gateProfile?.zip?.slice(0, 5) || extractZip(gateAddress) || undefined,
    });

    setGateLoading(true);
    setGateError(null);

    const payload = {
      name: gateName.trim(),
      email: gateEmail.trim(),
      phone: gatePhone.trim(),
      /* Omit when blank: the API treats budget as optional but rejects "" */
      budget: gateBudget || undefined,
      projectType: effectiveProject,
      address: gateAddress.trim(),
      zip: gateProfile?.zip?.slice(0, 5) || extractZip(gateAddress) || undefined,
      propertyProfile: gateProfile,
      estimate: {
        project: effectiveProject,
        finish,
        sqft,
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        roi: result.roi,
        refinements,
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
        ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50"
        : "bg-inverse-foreground/[0.06] border-inverse-foreground/[0.12] hover-elevate",
    );
  }

  /* ══════════════════════════════
     SECTIONS
  ══════════════════════════════ */

  /* Consistent, readable step label used across every input group. */
  const stepLabel = "block text-[13px] tracking-[0.12em] uppercase text-inverse-muted mb-3";

  /* Step 1 - Project type: prominent card grid (matches the other inputs) */
  const projectGrid = (
    <div className="mb-6">
      <p className={stepLabel}>{stepNo("project")} &middot; Choose your project</p>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        role="tablist"
        aria-label="Project type"
      >
        {PROJECT_TYPE_ORDER.map((type) => {
          const pc = PROJECT_CONFIGS[type];
          const Icon = PROJECT_ICONS[type];
          const active = chosen.project && activeProject === type;
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
              <span className="text-[15px] text-inverse-foreground leading-tight">{pc.tabLabel}</span>
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
      <p className="text-[12px] tracking-[0.16em] uppercase text-inverse-muted mb-2.5">
        Ballpark your project in under 60 seconds
      </p>
      <h2 className="font-sans font-light text-[clamp(1.75rem,4vw,3rem)] leading-[1.08] tracking-tight text-inverse-foreground">
        {!chosen.project ? (
          /* Before a project is picked the headline must not name one. */
          <>
            Calculate your <em className="brc-accent">remodel</em> cost
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

  /* Step 2 - Layout / type (drives refinement complexity) */
  const subtypeGrid = (
    <div>
      <p className={stepLabel}>{stepNo("layout")} &middot; {config.gridLabel}</p>
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

  /* Step 3 - Size: a precise sqft slider (cost is very size-sensitive). The chosen
     layout pre-sets a smart default; the slider fine-tunes for accuracy. */
  const sizePct = ((sqft - sizeConfig.min) / (sizeConfig.max - sizeConfig.min)) * 100;
  const sizeGrid = (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className={cn(stepLabel, "mb-0")}>{stepNo("size")} &middot; About how big?</p>
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
          background: `linear-gradient(to right, hsl(var(--accent-legible)) 0%, hsl(var(--accent-legible)) ${sizePct}%, hsl(var(--inverse-foreground) / 0.14) ${sizePct}%, hsl(var(--inverse-foreground) / 0.14) 100%)`,
        }}
      />
      <div className="flex justify-between mt-2 text-[12px] text-inverse-muted">
        <span>Compact ({sizeConfig.min.toLocaleString()})</span>
        <span>Large ({sizeConfig.max.toLocaleString()} sq ft)</span>
      </div>
      <p className="mt-2.5 text-[12.5px] text-inverse-muted/80 leading-relaxed">
        Not sure? The layout above sets a typical size. Drag only if your space is notably smaller or
        larger. Size is the biggest cost driver, so a closer number means a closer estimate.
      </p>
    </div>
  );

  /* Step 4 - Upgrades (optional add-ons) */
  const chipsRow = (
    <div className="mt-5">
      <p className={stepLabel}>{stepNo("upgrades")} &middot; {config.chipsLabel}</p>
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/80">
        Select all that apply. Optional, and it helps us understand your scope.
      </p>
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        role="group"
        aria-label={config.chipsLabel}
      >
        {config.chips.map((chip) => {
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
    </div>
  );

  /* Step 5 - Systems scope. Asked outright because it is a real cost driver
     (up to 1.22x) that used to be inferred from how many upgrade chips were
     ticked, which meant a visitor could not see it and never agreed to it. */
  const systemsRow = (
    <div className="mt-5">
      <p className={stepLabel}>{stepNo("systems")} &middot; {getPlumbingElectricalLabel(effectiveProject)}</p>
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/80">
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
                "rounded-md border py-3 px-3 min-h-[64px] transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
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
      <p className={stepLabel}>{stepNo("cabinetry")} &middot; Cabinetry</p>
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
                "rounded-md border py-3 px-3 min-h-[64px] transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
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
  const bathCountRow = (
    <div className="mt-5">
      <p className={stepLabel}>{stepNo("bathcount")} &middot; How many bathrooms?</p>
      <p className="-mt-2 mb-3 text-[12px] text-inverse-muted/80">
        {effectiveProject === "whole-home"
          ? "Bathrooms move a whole-home budget more than any other room. Count every one in the project."
          : "A bathroom is one of the largest single line items here. Count every one included."}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {(getAssumedBathrooms(effectiveProject) === 0
          ? [0, 1, 2, 3, 4, 5, 6]
          : [1, 2, 3, 4, 5, 6]
        ).map((n) => {
          const active = bathCount === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                setBathCount(n);
                fireEstimatorEngagement();
              }}
              data-testid={`calc-baths-${n}`}
              aria-pressed={active}
              className={cn(
                "rounded-md border py-3 min-h-[52px] text-[15px] transition-all duration-200",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
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
      <div className="mt-5">
        <p className={stepLabel}>{stepNo("kitchen")} &middot; {label}</p>
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
                }}
                data-testid={`calc-kitchen-${opt.value ? "yes" : "no"}`}
                aria-pressed={active}
                className={cn(
                  "rounded-md border py-3 px-3 min-h-[64px] transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                  active
                    ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                    : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
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
    <div className="mt-6 rounded-md border border-inverse-foreground/[0.14] bg-inverse-foreground/[0.04] p-4">
      <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
        Typical for a {FINISH_LABELS[finish]} {config.tabLabel.toLowerCase()}
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
  const finishRow = (
    <div className="mt-5">
      <p className={stepLabel}>{stepNo("finish")} &middot; Finish level</p>
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
                "rounded-md border py-3 px-2 min-h-[64px] transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
              )}
            >
              {/* Finish is the single biggest price driver (roughly 2x per tier),
                  so it gets the same explanatory subtitle the other cards have. */}
              <span className="text-[13.5px] text-inverse-foreground leading-tight">
                {ENGINE_FINISH_LABELS[level].label}
              </span>
              <span className="text-[11px] text-inverse-muted leading-tight">
                {ENGINE_FINISH_LABELS[level].sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Live planning range - always visible, updates as selections change */
  const resultPanel = (
    <div className="mt-8" aria-live="polite" aria-atomic="true">
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
              <span className="text-inverse-muted/60 mx-2 text-xl">to</span>
              {formatPlanningCurrency(result.priceHigh)}
            </div>
            <p className="mt-2.5 text-[14px] text-inverse-muted">
              Typical resale return for this project type: about {result.roi}%.
            </p>
            {/* Always visible, never behind a toggle: a homeowner must not be
                able to leave this screen thinking they were given a price. */}
            <p className="mt-3 text-[12.5px] text-inverse-foreground/90 leading-relaxed font-normal">
              {NOT_A_QUOTE_NOTICE}
            </p>
            <p className="mt-1.5 text-[12.5px] text-inverse-muted/80 leading-relaxed">
              {ONSITE_REQUIRED_NOTICE}
            </p>
          </div>

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
                <p className="text-[12px] text-inverse-muted/70 pt-1.5 leading-relaxed">
                  {INCLUDED_SCOPE_NOTE}
                </p>
                {effectiveProject === "kitchen" && (
                  <p className="text-[12px] text-inverse-muted/70 leading-relaxed">
                    {APPLIANCE_DISCLAIMER}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Component breakdown. Collapsed by default: most homeowners want the
              range, and the ones who want to know why it is that number get the
              same line items the team sees. Lines are a typical allocation of a
              validated total, so TAKEOFF_BASIS_NOTICE renders with them. */}
          <div className="border-t border-inverse-foreground/10 pt-4">
            <button
              type="button"
              onClick={() => setTakeoffOpen((p) => !p)}
              className="flex w-full items-center justify-between text-left"
              data-testid="button-toggle-takeoff"
              aria-expanded={takeoffOpen}
            >
              <span className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground">
                Where the money typically goes
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-inverse-muted transition-transform", takeoffOpen && "rotate-180")}
              />
            </button>
            {takeoffOpen && (() => {
              const takeoff = takeoffForRange(
                effectiveProject,
                finish,
                sqft,
                result.priceLow,
                result.priceHigh,
                unitCostOverrides,
              );
              const group = (g: "direct" | "soft") =>
                takeoff.lines.filter((l) => l.group === g && l.cost > 0);
              const groupLabel = "text-[11.5px] tracking-[0.1em] uppercase text-inverse-muted/70 pt-2.5 pb-1";
              const row = (l: (typeof takeoff.lines)[number]) => {
                const qty = formatQuantity(l);
                return (
                  <div
                    key={l.id}
                    className="flex items-baseline justify-between gap-3 text-[13.5px] text-inverse-muted leading-snug py-1"
                    data-testid={`takeoff-line-${l.id}`}
                  >
                    <span>
                      {l.label}
                      {qty && <span className="text-inverse-muted/60"> ({qty})</span>}
                    </span>
                    <span className="tabular-nums whitespace-nowrap text-inverse-foreground/90">
                      {formatTakeoffAmount(l.cost)}
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
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px] pt-3 mt-2 border-t border-inverse-foreground/10">
                    <span className="text-inverse-muted">Midpoint of your range</span>
                    <span className="tabular-nums whitespace-nowrap text-inverse-foreground">
                      {formatTakeoffAmount(takeoff.total)}
                    </span>
                  </div>
                  <p className="text-[12px] text-inverse-muted/70 pt-3 leading-relaxed">
                    {TAKEOFF_BASIS_NOTICE}
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
                        className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\00d7'] before:absolute before:left-0 before:text-inverse-muted/70"
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
                      <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2022'] before:absolute before:left-0 before:text-inverse-muted/70">
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
                        <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2191'] before:absolute before:left-0 before:text-inverse-muted/70">
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
                        <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\2193'] before:absolute before:left-0 before:text-inverse-muted/70">
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
                      <li key={i} className="text-[13px] text-inverse-muted leading-snug pl-4 relative before:content-['\002b'] before:absolute before:left-0 before:text-inverse-muted/70">
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
              className="flex items-center gap-1.5 text-[12px] text-inverse-muted/70 hover:text-inverse-muted transition-colors"
              aria-expanded={legalOpen}
            >
              Why a range, not a fixed price?
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", legalOpen && "rotate-180")} />
            </button>
            {legalOpen && (
              <p className="text-[12px] text-inverse-muted/70 leading-relaxed mt-2">
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
    <div className="mt-8 border-t border-inverse-foreground/15 pt-6">
      <Button
        type="button"
        onClick={() => setGateOpen(true)}
        data-testid="button-get-estimate"
        className="w-full h-14 bg-inverse-foreground text-inverse text-[14px] tracking-[0.12em] uppercase"
      >
        Get My Estimate Range
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-[12px] text-inverse-muted/70 text-center mt-3 leading-relaxed">
        Takes 30 seconds. We will email you a copy too.
      </p>
    </div>
  );

  /* Lead-gate panel - shown in place of the result until contact info is submitted */
  const subtypeTitle =
    config.subtypes.find((s) => s.id === subtype)?.title ?? config.tabLabel;

  const leadsGatePanel = (
    <div className="mt-8 border-t border-inverse-foreground/15 pt-6" aria-label="Unlock your estimate">
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
              Enter your info below to see it
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
            {FINISH_LABELS[finish]}
          </span>
        </div>

        {/* Blurred price teaser */}
        <div className="relative select-none">
          <div
            className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(32px,8vw,52px)] blur-sm pointer-events-none"
            aria-hidden="true"
          >
            {formatPlanningCurrency(result.priceLow)}
            <span className="text-inverse-muted/60 mx-2 text-xl">to</span>
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
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/60 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-name"
            autoComplete="given-name"
          />
          <input
            type="email"
            placeholder="Email address"
            value={gateEmail}
            onChange={(e) => setGateEmail(e.target.value)}
            required
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/60 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-email"
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={gatePhone}
            onChange={(e) => setGatePhone(e.target.value)}
            required
            minLength={10}
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground placeholder:text-inverse-muted/60 outline-none focus:border-inverse-foreground/50 transition-colors"
            data-testid="gate-input-phone"
            autoComplete="tel"
          />

          <div>
            <AddressAutocomplete
              value={gateAddress}
              onChange={setGateAddress}
              onProfileResolved={(profile) => {
                setGateProfile(profile);
                // The lookup returns a normalized address; prefer it so the
                // team gets a clean, geocodable line rather than free text.
                if (profile?.formattedAddress) setGateAddress(profile.formattedAddress);
              }}
              data-testid="gate-input-address"
            />
            <p className="mt-1.5 text-[11.5px] text-inverse-muted/80">
              So we can confirm we serve your area and check county records before your visit.
            </p>
          </div>
          <select
            value={gateBudget}
            onChange={(e) => setGateBudget(e.target.value)}
            className="w-full bg-inverse-foreground/[0.07] border border-inverse-foreground/20 rounded-md px-4 py-3 text-[14px] text-inverse-foreground outline-none focus:border-inverse-foreground/50 transition-colors appearance-none cursor-pointer"
            data-testid="gate-select-budget"
          >
            <option value="" className="bg-neutral-900 text-inverse-muted">
              Desired budget range (optional)
            </option>
            {BUDGET_RANGES[effectiveProject].map((range) => (
              <option key={range} value={range} className="bg-neutral-900 text-inverse-foreground">
                {range}
              </option>
            ))}
          </select>
          {gateError && (
            <p className="text-[12px] text-red-400">{gateError}</p>
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
          <p className="text-[12px] text-inverse-muted/70 text-center leading-relaxed">
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
      {projectGrid}
      {/* Each step appears only once the one before it has been answered, so a
          visitor is never presented with a pre-filled choice they did not make
          and cannot reach an estimate without selecting every input. */}
      {chosen.project && subtypeGrid}
      {chosen.subtype && sizeGrid}
      {chosen.subtype && chipsRow}
      {chosen.subtype && showBathCount && bathCountRow}
      {chosen.subtype && showKitchenIncluded && kitchenRow}
      {chosen.subtype && finishRow}
      {chosen.finish && typicalPanel}
      {allChosen &&
        (gateSubmitted ? resultPanel : gateOpen ? leadsGatePanel : calculateCta)}
    </>
  );

  /* inModal: compact card without full-viewport constraint */
  if (inModal) {
    return (
      <div className="bg-inverse text-inverse-foreground rounded-lg p-5 sm:p-6">
        {flow}
      </div>
    );
  }

  /* Full page: dark section that sizes to its content (no forced viewport height,
     no footer banner, no dead space below the form). */
  return (
    <Section id="calculator" variant="inverse" divider className="scroll-mt-16">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">{flow}</div>
      </div>
    </Section>
  );
}
