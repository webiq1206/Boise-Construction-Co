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
import {
  type ProjectType,
  type FinishLevel,
  type EstimateRefinements,
  type EstimateInput,
  type EstimateResult,
  EMPTY_REFINEMENTS,
  getAvailableFinishLevels,
  PROJECT_SIZE_CONFIG,
  formatPlanningCurrency,
  calculateEstimate,
  buildStoredEstimate,
  countVisibleUserRefinements,
  getSetRefinementKeys,
  INCLUDED_SCOPE_NOTE,
  APPLIANCE_DISCLAIMER,
} from "@/shared/estimateEngine";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { applyLeadParams } from "@/lib/leadPrefill";

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
    "single-room":   { sqft: 400,  refinements: { roomCount: 1 } },
    "multi-room":    { sqft: 900,  refinements: { roomCount: 4 } },
    "whole-home":    { sqft: 1800, refinements: { roomCount: 8 } },
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

function buildRefinements(
  effectiveProject: ProjectType,
  _subtype: string,
  addOns: string[],
  subtypeRef: Partial<EstimateRefinements>,
): EstimateRefinements {
  const ref: EstimateRefinements = { ...EMPTY_REFINEMENTS, ...subtypeRef };

  switch (effectiveProject) {
    case "kitchen": {
      if (addOns.includes("cabinets")) ref.cabinetTier = "semi-custom";
      if (addOns.length === 4) {
        ref.plumbingElectrical = "full";
      } else if (addOns.includes("counters") && addOns.includes("lighting")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "bathroom": {
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1) ref.plumbingElectrical = "partial";
      break;
    }
    case "whole-home": {
      if (addOns.includes("layout")) ref.layoutChanges = "moderate";
      if (addOns.includes("kitchen") && addOns.includes("baths")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "addition": {
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1 && !ref.plumbingElectrical) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "adu": {
      if (addOns.length === 4) {
        ref.plumbingElectrical = "full";
      } else if (addOns.includes("kitchen") && addOns.includes("bath")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "basement": {
      if (addOns.includes("bath") && addOns.includes("wet-bar")) {
        ref.plumbingElectrical = "full";
      } else if (addOns.includes("bath")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
  }

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
  const [scopeOpen, setScopeOpen]         = useState(false);
  const [legalOpen, setLegalOpen]         = useState(false);
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
    if (!availFinish.includes(finish)) setFinish("mid-range");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availFinish]);

  /* Size config (min / max / step / baseline) for the sqft slider, per project. */
  const sizeConfig = PROJECT_SIZE_CONFIG[effectiveProject];

  const refinements = useMemo<EstimateRefinements>(() => {
    const data = SUBTYPE_DATA[activeProject]?.[subtype];
    if (!data) return { ...EMPTY_REFINEMENTS };
    return buildRefinements(effectiveProject, subtype, addOns, data.refinements);
  }, [effectiveProject, activeProject, subtype, addOns]);

  const userRefinementCount = useMemo(
    () => countVisibleUserRefinements(effectiveProject, getSetRefinementKeys(refinements)),
    [effectiveProject, refinements],
  );

  const result = useMemo<EstimateResult>(() => {
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    return calculateEstimate(input, userRefinementCount);
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

  /* ── Persist to sessionStorage (live, on every change) ── */
  useEffect(() => {
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify(buildStoredEstimate(input, userRefinementCount)),
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

  /* On mount: apply lead-form prefill + gate bypass for pre-qualified traffic
     (e.g. a Meta Instant Form click that already captured their contact info),
     then restore gate state for return visits. A pre-qualified visitor skips the
     gate entirely and sees the range instantly - no re-entering their info. */
  useEffect(() => {
    const { prefill } = applyLeadParams();
    if (prefill.name) setGateName(prefill.name);
    if (prefill.email) setGateEmail(prefill.email);
    if (prefill.phone) setGatePhone(prefill.phone);
    if (sessionStorage.getItem("brc_gate_passed") === "1") {
      setGateSubmitted(true);
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
    if (type === activeProject) return;
    const sub = defaultSubtypeFor(type);
    setActiveProject(type);
    setSubtype(sub);
    setSqft(SUBTYPE_DATA[type][sub].sqft);
    setAddOns([]);
    const avail = getAvailableFinishLevels(type);
    if (!avail.includes(finish)) setFinish("mid-range");
    fireEstimatorEngagement();
  }

  /* Selecting a layout sets a smart default size, which the slider fine-tunes. */
  function handleSelectSubtype(id: string) {
    setSubtype(id);
    const data = SUBTYPE_DATA[activeProject]?.[id];
    if (data) {
      const c = PROJECT_SIZE_CONFIG[data.projectOverride ?? activeProject];
      setSqft(Math.max(c.min, Math.min(c.max, data.sqft)));
    }
    fireEstimatorEngagement();
  }

  function handleSelectFinish(level: FinishLevel) {
    setFinish(level);
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
    /* Budget is optional: an extra required field before the number is friction
       and reads as a bait-and-switch. We still capture it when offered. */

    setGateLoading(true);
    setGateError(null);

    const payload = {
      name: gateName.trim(),
      email: gateEmail.trim(),
      phone: gatePhone.trim(),
      /* Omit when blank: the API treats budget as optional but rejects "" */
      budget: gateBudget || undefined,
      projectType: effectiveProject,
      estimate: {
        project: effectiveProject,
        finish,
        sqft,
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        roi: result.roi,
        refinements,
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
        sessionStorage.setItem("brc_gate_passed", "1");
        setGateSubmitted(true);
      } else if (res.status >= 500) {
        /* Server/infra error: not the user's fault; reveal so they aren't hard-blocked */
        console.warn("[gate] Server error", res.status, "- revealing estimate anyway");
        sessionStorage.setItem("brc_gate_passed", "1");
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
      sessionStorage.setItem("brc_gate_passed", "1");
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
      <p className={stepLabel}>1 &middot; Choose your project</p>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        role="tablist"
        aria-label="Project type"
      >
        {PROJECT_TYPE_ORDER.map((type) => {
          const pc = PROJECT_CONFIGS[type];
          const Icon = PROJECT_ICONS[type];
          const active = activeProject === type;
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
        {config.twoLineHeadline ? (
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
      <p className={stepLabel}>2 &middot; {config.gridLabel}</p>
      <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={config.gridLabel}>
        {config.subtypes.map((opt) => {
          const Icon = opt.icon;
          const active = subtype === opt.id;
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
        <p className={cn(stepLabel, "mb-0")}>3 &middot; About how big?</p>
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
      <p className={stepLabel}>4 &middot; {config.chipsLabel}</p>
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

  /* Step 5 - Finish level (options tied to effectiveProject) */
  const finishRow = (
    <div className="mt-5">
      <p className={stepLabel}>5 &middot; Finish level</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {availFinish.map((level) => {
          const active = finish === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelectFinish(level)}
              data-testid={`calc-finish-${level}`}
              aria-pressed={active}
              className={cn(
                "rounded-md border text-[13.5px] py-3 min-h-[48px] transition-all duration-200",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.05] border-inverse-foreground/[0.12] text-inverse-muted hover-elevate",
              )}
            >
              {FINISH_LABELS[level]}
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
              Est. {result.roi}% ROI based on Boise market data.
            </p>
            <p className="mt-2.5 text-[12.5px] text-inverse-muted/80 leading-relaxed">
              This is a ballpark planning range, not a quote or bid. Actual cost depends on your
              home, selections, and site conditions. Your free in-home visit provides an exact,
              written price.
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
      {subtypeGrid}
      {sizeGrid}
      {chipsRow}
      {finishRow}
      {gateSubmitted ? resultPanel : gateOpen ? leadsGatePanel : calculateCta}
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
