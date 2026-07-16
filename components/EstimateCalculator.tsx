"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check, ChevronDown, ArrowRight,
  UtensilsCrossed, Droplets, Home, Building2, Layers, AlignLeft,
  LayoutGrid, Star, Sun, Monitor, Dumbbell, Bed, Car,
  Lightbulb, Wind, DoorOpen, GlassWater, Sofa, Frame, Triangle, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing";
import { AnimatedPrice } from "@/components/estimate/EstimateResultPanel";
import {
  type ProjectType,
  type FinishLevel,
  type EstimateRefinements,
  type EstimateInput,
  type EstimateResult,
  EMPTY_REFINEMENTS,
  getAvailableFinishLevels,
  calculateEstimate,
  buildStoredEstimate,
  countVisibleUserRefinements,
  getSetRefinementKeys,
  INCLUDED_SCOPE_NOTE,
  APPLIANCE_DISCLAIMER,
} from "@/shared/estimateEngine";

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
  icon: LucideIcon;
  tabLabel: string;
  headlinePrefix: string;
  headlineAccent: string;
  headlineSuffix: string;
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

/* ══════════════════════════════════════════════════════════════════════
   FOOTER STRIP IMAGES (per project type)
══════════════════════════════════════════════════════════════════════ */

const FOOTER_BG: Record<ProjectType, string> = {
  kitchen:      "/images/gallery/gallery-kitchen-after.webp",
  bathroom:     "/images/gallery/gallery-bathroom-after.webp",
  "whole-home": "/images/gallery/gallery-kitchen-after.webp",
  addition:     "/images/gallery/gallery-addition-after.webp",
  adu:          "/images/gallery/gallery-addition-after.webp",
  basement:     "/images/gallery/gallery-basement-after.webp",
};

/* ══════════════════════════════════════════════════════════════════════
   PROJECT UI CONFIGS
══════════════════════════════════════════════════════════════════════ */

const PROJECT_CONFIGS: Record<ProjectType, ProjectUIConfig> = {
  kitchen: {
    icon: UtensilsCrossed,
    tabLabel: "Kitchen",
    headlinePrefix: "Calculate your",
    headlineAccent: "kitchen",
    headlineSuffix: "remodel cost",
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
    icon: Droplets,
    tabLabel: "Bathroom",
    headlinePrefix: "Calculate your",
    headlineAccent: "bathroom",
    headlineSuffix: "remodel cost",
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
    icon: Home,
    tabLabel: "Whole-Home",
    headlinePrefix: "Calculate your",
    headlineAccent: "home",
    headlineSuffix: "remodel cost",
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
    icon: Building2,
    tabLabel: "Addition",
    headlinePrefix: "Calculate your room",
    headlineAccent: "addition",
    headlineSuffix: "cost",
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
    icon: Building2,
    tabLabel: "ADU",
    headlinePrefix: "Calculate your",
    headlineAccent: "ADU",
    headlineSuffix: "cost",
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
    icon: Layers,
    tabLabel: "Basement",
    headlinePrefix: "Calculate your",
    headlineAccent: "basement",
    headlineSuffix: "finishing cost",
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
      // CABINETS -> cabinetTier: semi-custom
      if (addOns.includes("cabinets")) ref.cabinetTier = "semi-custom";
      // COUNTERS + LIGHTING together -> partial; all four -> full
      if (addOns.length === 4) {
        ref.plumbingElectrical = "full";
      } else if (addOns.includes("counters") && addOns.includes("lighting")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "bathroom": {
      // 1-2 -> partial; 3-4 -> full
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1) ref.plumbingElectrical = "partial";
      break;
    }
    case "whole-home": {
      // LAYOUT -> layoutChanges: moderate; KITCHEN+BATHS -> partial only
      if (addOns.includes("layout")) ref.layoutChanges = "moderate";
      if (addOns.includes("kitchen") && addOns.includes("baths")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "addition": {
      // 1-2 -> partial; 3-4 -> full
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1 && !ref.plumbingElectrical) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "adu": {
      // KITCHEN+BATH -> partial; all four -> full
      if (addOns.length === 4) {
        ref.plumbingElectrical = "full";
      } else if (addOns.includes("kitchen") && addOns.includes("bath")) {
        ref.plumbingElectrical = "partial";
      }
      break;
    }
    case "basement": {
      // BATH -> partial; BATH+WET BAR -> full; EGRESS handled via sqft bump
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
   SQFT CALCULATOR  (includes basement EGRESS sqft bump)
══════════════════════════════════════════════════════════════════════ */

function computeSqft(
  projectType: ProjectType,
  subtype: string | null,
  addOns: string[],
): number | null {
  if (!subtype) return null;
  const data = SUBTYPE_DATA[projectType]?.[subtype];
  if (!data) return null;
  let sqft = data.sqft;
  // EGRESS window + well adds carpentry / structural cost modeled as sqft bump
  if (projectType === "basement" && addOns.includes("egress")) sqft += 100;
  return sqft;
}

/* ══════════════════════════════════════════════════════════════════════
   FOOTER STRIP  (outside main component to avoid remount anti-pattern)
══════════════════════════════════════════════════════════════════════ */

function FooterStrip({
  activeProject,
  footerAccent,
  onConsultClick,
}: {
  activeProject: ProjectType;
  footerAccent: string;
  onConsultClick: () => void;
}) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 overflow-hidden">
      {/* Blurred photo bg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${FOOTER_BG[activeProject]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(10px)",
        }}
      />
      {/* Overlay */}
      <div aria-hidden="true" className="absolute inset-0 bg-inverse/78" />

      {/* Wordmark */}
      <p className="relative text-[8px] tracking-[0.22em] uppercase text-inverse-foreground/80 font-medium select-none">
        BOISE REMODELING Co.
      </p>

      {/* CTA link */}
      <button
        type="button"
        onClick={onConsultClick}
        className="relative flex items-center gap-1.5 text-[11px] text-inverse-foreground hover:text-accent-legible transition-colors"
        data-testid="link-footer-consult"
      >
        See my{" "}
        <em className="brc-accent">{footerAccent}</em>
        {" "}price
        <ArrowRight className="h-3 w-3" />
      </button>

      {/* Phone */}
      <p className="relative text-[11px] text-inverse-muted hidden sm:block">(208) 477-1169</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */

const FINISH_LABELS: Record<FinishLevel, string> = {
  refresh: "Refresh",
  "mid-range": "Mid-Range",
  "high-end": "High-End",
  luxury: "Luxury",
};

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
  const [subtype, setSubtype]             = useState<string | null>(null);
  const [addOns, setAddOns]               = useState<string[]>([]);
  const [finish, setFinish]               = useState<FinishLevel>("mid-range");
  const [showResult, setShowResult]       = useState(false);
  const [gridNudge, setGridNudge]         = useState(false);
  const [scopeOpen, setScopeOpen]         = useState(false);
  const [legalOpen, setLegalOpen]         = useState(false);
  const nudgeTimer = useRef<number | null>(null);

  /* ── Derived ── */
  const config = PROJECT_CONFIGS[activeProject];
  const availFinish = getAvailableFinishLevels(activeProject);

  const effectiveProject = useMemo<ProjectType>(() => {
    if (!subtype) return activeProject;
    return SUBTYPE_DATA[activeProject]?.[subtype]?.projectOverride ?? activeProject;
  }, [activeProject, subtype]);

  const sqft = useMemo(
    () => computeSqft(activeProject, subtype, addOns),
    [activeProject, subtype, addOns],
  );

  const refinements = useMemo<EstimateRefinements>(() => {
    if (!subtype) return { ...EMPTY_REFINEMENTS };
    const data = SUBTYPE_DATA[activeProject]?.[subtype];
    if (!data) return { ...EMPTY_REFINEMENTS };
    return buildRefinements(effectiveProject, subtype, addOns, data.refinements);
  }, [effectiveProject, activeProject, subtype, addOns]);

  const userRefinementCount = useMemo(
    () => countVisibleUserRefinements(effectiveProject, getSetRefinementKeys(refinements)),
    [effectiveProject, refinements],
  );

  const result = useMemo<EstimateResult | null>(() => {
    if (!sqft) return null;
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    return calculateEstimate(input, userRefinementCount);
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

  /* ── Persist to sessionStorage ── */
  useEffect(() => {
    if (!result || !sqft) return;
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify(buildStoredEstimate(input, userRefinementCount)),
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
  }, [result, effectiveProject, finish, sqft, refinements, userRefinementCount]);

  useEffect(() => () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); }, []);

  /* ── Handlers ── */
  function handleSelectProject(type: ProjectType) {
    if (type === activeProject) return;
    setActiveProject(type);
    setSubtype(null);
    setAddOns([]);
    setShowResult(false);
    setScopeOpen(false);
    const avail = getAvailableFinishLevels(type);
    if (!avail.includes(finish)) setFinish("mid-range");
  }

  function handleSelectSubtype(id: string) {
    setSubtype(id);
    // If the result is already showing, keep it visible (live update)
  }

  function handleToggleChip(id: string) {
    setAddOns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleCalculate() {
    if (!subtype) {
      setGridNudge(true);
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      nudgeTimer.current = window.setTimeout(() => setGridNudge(false), 900);
      return;
    }
    setShowResult(true);
    setScopeOpen(false);
  }

  function handleBookVisit() {
    if (onBookVisitProp) {
      onBookVisitProp();
    } else {
      document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ── Shared card class ── */
  function darkCard(active: boolean) {
    return cn(
      "relative rounded-md border text-left transition-all duration-200",
      active
        ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50"
        : "bg-inverse-foreground/[0.06] border-inverse-foreground/[0.12] hover-elevate",
    );
  }

  /* ══════════════════════════════
     RENDER HELPERS
  ══════════════════════════════ */

  /* Project pill tabs */
  const tabStrip = (
    <div
      className="flex gap-1.5 flex-wrap flex-shrink-0 mb-3"
      role="tablist"
      aria-label="Project type"
    >
      {PROJECT_TYPE_ORDER.map((type) => {
        const pc = PROJECT_CONFIGS[type];
        const active = activeProject === type;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => handleSelectProject(type)}
            data-testid={`calc-tab-${type}`}
            className={cn(
              "px-3 py-1.5 rounded-full border text-[10px] tracking-wide transition-all duration-200",
              active
                ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                : "bg-transparent border-inverse-foreground/[0.14] text-inverse-muted hover-elevate",
            )}
          >
            {pc.tabLabel}
          </button>
        );
      })}
    </div>
  );

  /* Headline */
  const headline = (
    <div className="flex-shrink-0 mb-3" key={activeProject}>
      <p className="text-[9px] tracking-[0.2em] uppercase text-inverse-muted mb-1">
        BALLPARK YOUR PROJECT IN UNDER 60 SECONDS
      </p>
      <h2 className="font-sans font-light text-[clamp(1.35rem,3.2vw,2.5rem)] leading-[1.1] tracking-tight text-inverse-foreground">
        {config.headlinePrefix}{" "}
        <em className="brc-accent">{config.headlineAccent}</em>{" "}
        {config.headlineSuffix}
      </h2>
    </div>
  );

  /* Subtype 2x2 grid */
  const subtypeGrid = (
    <div key={`grid-${activeProject}`}>
      <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted mb-2.5">
        {config.gridLabel}
      </p>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 transition-all duration-300",
          gridNudge && "ring-2 ring-accent-legible/60 ring-offset-2 ring-offset-inverse rounded-lg",
        )}
        role="group"
        aria-label={config.gridLabel}
      >
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
              className={cn(darkCard(active), "flex items-start gap-2.5 p-2.5")}
            >
              {active && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                  <Check className="h-2.5 w-2.5 text-inverse" />
                </span>
              )}
              <Icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent-legible" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium text-inverse-foreground leading-tight">
                  {opt.title}
                </span>
                <span className="block text-[10px] italic text-inverse-muted leading-snug mt-0.5">
                  {opt.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Add-on chips */
  const chipsRow = (
    <div className="mt-3" key={`chips-${activeProject}`}>
      <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted mb-2">
        {config.chipsLabel}
      </p>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label={config.chipsLabel}>
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
                "flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-center",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-accent-legible" : "text-inverse-muted",
                )}
              />
              <span className="text-[8px] tracking-widest uppercase text-inverse-foreground leading-tight">
                {chip.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Finish level secondary row */
  const finishRow = (
    <div className="flex-shrink-0 mt-3">
      <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted mb-2">
        FINISH LEVEL
      </p>
      <div className="flex gap-1.5">
        {availFinish.map((level) => {
          const active = finish === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => setFinish(level)}
              data-testid={`calc-finish-${level}`}
              aria-pressed={active}
              className={cn(
                "flex-1 py-1.5 rounded-md border text-[10px] font-normal transition-all duration-200",
                active
                  ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50 text-inverse-foreground"
                  : "bg-inverse-foreground/[0.04] border-inverse-foreground/[0.10] text-inverse-muted hover-elevate",
              )}
            >
              {FINISH_LABELS[level]}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Inline result panel */
  const resultPanel = result ? (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none space-y-3">
      {/* Price range */}
      <div>
        <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted mb-1.5">
          Planning range
        </p>
        <div
          className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(26px,6.5vw,44px)]"
          data-testid="estimate-range"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatedPrice value={result.priceLow} />
          <span className="text-inverse-muted/60 mx-1 text-lg">to</span>
          <AnimatedPrice value={result.priceHigh} />
        </div>
      </div>

      {/* ROI */}
      <p className="text-[11px] text-inverse-muted">
        Est. {result.roi}% ROI based on Boise market data.
      </p>

      {/* Scope toggle */}
      <div className="border-t border-inverse-foreground/10 pt-2.5">
        <button
          type="button"
          onClick={() => setScopeOpen((p) => !p)}
          className="flex w-full items-center justify-between text-left py-0.5"
          data-testid="button-toggle-scope"
          aria-expanded={scopeOpen}
        >
          <span className="text-[9px] tracking-widest uppercase text-inverse-muted">
            What&apos;s typically included ({result.included.length})
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-inverse-muted transition-transform",
              scopeOpen && "rotate-180",
            )}
          />
        </button>
        {scopeOpen && (
          <div className="pt-2 space-y-1.5" id="estimate-scope-list">
            {result.included.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[10px] text-inverse-muted leading-snug"
                data-testid={`included-item-${i}`}
              >
                <Check className="h-2.5 w-2.5 flex-shrink-0 mt-0.5 text-accent-legible" />
                {item}
              </div>
            ))}
            <p className="text-[9px] text-inverse-muted/70 pt-1 leading-relaxed">
              {INCLUDED_SCOPE_NOTE}
            </p>
            {effectiveProject === "kitchen" && (
              <p className="text-[9px] text-inverse-muted/70 leading-relaxed">
                {APPLIANCE_DISCLAIMER}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legal note toggle */}
      <div>
        <button
          type="button"
          onClick={() => setLegalOpen((p) => !p)}
          className="flex items-center gap-1 text-[9px] text-inverse-muted/60 hover:text-inverse-muted transition-colors"
          aria-expanded={legalOpen}
        >
          Why a range, not a fixed price?
          <ChevronDown className={cn("h-3 w-3 transition-transform", legalOpen && "rotate-180")} />
        </button>
        {legalOpen && (
          <p className="text-[9px] text-inverse-muted/70 leading-relaxed mt-1.5">
            Planning estimate only - not a proposal, bid, or guaranteed cost. Ranges
            reflect project type, size, location, and finish assumptions. Your consultation
            delivers a detailed evaluation tailored to your home.
          </p>
        )}
      </div>

      {/* Edit link */}
      <button
        type="button"
        onClick={() => { setShowResult(false); setScopeOpen(false); setLegalOpen(false); }}
        className="text-[10px] text-inverse-muted hover:text-inverse-foreground transition-colors"
        data-testid="button-edit-estimate"
      >
        Edit selections
      </button>
    </div>
  ) : (
    <div className="flex items-center h-full">
      <p className="text-[12px] text-inverse-muted">
        Select a subtype above and tap Calculate.
      </p>
    </div>
  );

  /* CTA button */
  const ctaButton = (
    <div className="flex-shrink-0 mt-3">
      <Button
        onClick={showResult ? handleBookVisit : handleCalculate}
        data-testid={showResult ? "button-book-visit" : "button-calculate"}
        className={cn(
          "w-full tracking-[0.14em] text-[11px] uppercase font-normal",
          "bg-inverse-foreground text-inverse",
        )}
      >
        {showResult ? (
          <>
            Book a Free Visit
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          "CALCULATE MY COST"
        )}
      </Button>
    </div>
  );

  /* ══════════════════════════════
     LAYOUTS
  ══════════════════════════════ */

  /* inModal: compact scrollable layout without full-viewport constraint */
  if (inModal) {
    return (
      <div className="bg-inverse text-inverse-foreground rounded-lg p-5 flex flex-col gap-0">
        {tabStrip}
        {headline}
        <div className="mb-0">
          {showResult ? resultPanel : (
            <>
              {subtypeGrid}
              {chipsRow}
            </>
          )}
        </div>
        {finishRow}
        {ctaButton}
      </div>
    );
  }

  /* Inline: full-viewport dark section, single screen */
  return (
    <Section
      id="calculator"
      variant="inverse"
      spacing="none"
      divider
      style={{ minHeight: "100dvh" } as React.CSSProperties}
      className="flex flex-col"
    >
      {/* Main content area */}
      <div className="container px-4 sm:px-6 pt-16 pb-2 flex-1 flex flex-col min-h-0">
        {tabStrip}
        {headline}

        {/* Swap zone: inputs or result - takes remaining flex space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {showResult ? resultPanel : (
            <div key={activeProject} className="h-full">
              {subtypeGrid}
              {chipsRow}
            </div>
          )}
        </div>

        {finishRow}
        {ctaButton}
      </div>

      {/* Footer strip - always at the bottom of the dark section */}
      <FooterStrip
        activeProject={activeProject}
        footerAccent={config.footerAccent}
        onConsultClick={handleBookVisit}
      />
    </Section>
  );
}
