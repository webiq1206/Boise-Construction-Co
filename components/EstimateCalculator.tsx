"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft, Check, ChevronDown, ArrowRight,
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
  getSizePresets,
  getProjectSizeConfig,
  calculateEstimate,
  buildStoredEstimate,
  countVisibleUserRefinements,
  getSetRefinementKeys,
  INCLUDED_SCOPE_NOTE,
  APPLIANCE_DISCLAIMER,
} from "@/shared/estimateEngine";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */

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
  subtypeLabel: string;
  subtypes: SubtypeOption[];
  chipLabel: string;
  chips: ChipOption[];
}

type SubtypeData = {
  sqft: number;
  refinements: Partial<EstimateRefinements>;
  projectOverride?: ProjectType;
};

/* ═══════════════════════════════════════════════════════════════════════
   SUBTYPE SQFT + REFINEMENT SEEDS
   (drives the engine without touching estimateEngine.ts)
═══════════════════════════════════════════════════════════════════════ */

const SUBTYPE_DATA: Record<ProjectType, Record<string, SubtypeData>> = {
  kitchen: {
    galley:      { sqft: 175, refinements: { layoutChanges: "none" } },
    "l-shape":   { sqft: 250, refinements: { layoutChanges: "none" } },
    "u-shape":   { sqft: 325, refinements: { layoutChanges: "moderate" } },
    island:      { sqft: 400, refinements: { layoutChanges: "moderate" } },
  },
  bathroom: {
    powder:            { sqft: 50,  refinements: { fixtureCount: 1 } },
    "guest-bath":      { sqft: 80,  refinements: { fixtureCount: 2 } },
    "primary-suite":   { sqft: 120, refinements: { fixtureCount: 3 } },
    "walk-in-shower":  { sqft: 90,  refinements: { fixtureCount: 2, layoutChanges: "moderate" } },
  },
  "whole-home": {
    "single-room":    { sqft: 400,  refinements: { roomCount: 1 } },
    "multi-room":     { sqft: 900,  refinements: { roomCount: 4 } },
    "whole-home":     { sqft: 1800, refinements: { roomCount: 8 } },
    "home-addition":  { sqft: 500,  refinements: {}, projectOverride: "addition" },
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

/* ═══════════════════════════════════════════════════════════════════════
   PROJECT UI CONFIGS
═══════════════════════════════════════════════════════════════════════ */

const PROJECT_CONFIGS: Record<ProjectType, ProjectUIConfig> = {
  kitchen: {
    icon: UtensilsCrossed,
    tabLabel: "Kitchen",
    headlinePrefix: "Calculate your",
    headlineAccent: "kitchen",
    headlineSuffix: "remodel cost",
    subtypeLabel: "YOUR KITCHEN LAYOUT",
    subtypes: [
      { id: "galley",   icon: AlignLeft,  title: "Galley",  subtitle: "Two facing runs" },
      { id: "l-shape",  icon: Frame,      title: "L-Shape", subtitle: "Corner run" },
      { id: "u-shape",  icon: Grid3x3,    title: "U-Shape", subtitle: "Three walls" },
      { id: "island",   icon: LayoutGrid, title: "Island",  subtitle: "Open concept" },
    ],
    chipLabel: "WHAT ARE YOU UPGRADING?",
    chips: [
      { id: "cabinets", icon: LayoutGrid, label: "CABINETS" },
      { id: "counters", icon: Layers,     label: "COUNTERS" },
      { id: "flooring", icon: Grid3x3,    label: "FLOORING" },
      { id: "lighting", icon: Lightbulb,  label: "LIGHTING" },
    ],
  },
  bathroom: {
    icon: Droplets,
    tabLabel: "Bathroom",
    headlinePrefix: "Calculate your",
    headlineAccent: "bathroom",
    headlineSuffix: "remodel cost",
    subtypeLabel: "YOUR BATHROOM TYPE",
    subtypes: [
      { id: "powder",          icon: Droplets,   title: "Powder",         subtitle: "Sink and toilet" },
      { id: "guest-bath",      icon: Layers,     title: "Guest Bath",     subtitle: "Tub and shower" },
      { id: "primary-suite",   icon: Star,       title: "Primary Suite",  subtitle: "Spa retreat" },
      { id: "walk-in-shower",  icon: Wind,       title: "Walk-in Shower", subtitle: "Curbless" },
    ],
    chipLabel: "WHAT ARE YOU UPGRADING?",
    chips: [
      { id: "shower", icon: Droplets,  label: "SHOWER" },
      { id: "vanity", icon: Star,      label: "VANITY" },
      { id: "tub",    icon: Layers,    label: "TUB" },
      { id: "tile",   icon: Grid3x3,   label: "TILE" },
    ],
  },
  "whole-home": {
    icon: Home,
    tabLabel: "Whole-Home",
    headlinePrefix: "Calculate your",
    headlineAccent: "home",
    headlineSuffix: "remodel cost",
    subtypeLabel: "YOUR PROJECT SCOPE",
    subtypes: [
      { id: "single-room",   icon: Layers,     title: "Single Room",   subtitle: "One space" },
      { id: "multi-room",    icon: LayoutGrid,  title: "Multi-Room",    subtitle: "A few spaces" },
      { id: "whole-home",    icon: Home,        title: "Whole Home",    subtitle: "Full renovation" },
      { id: "home-addition", icon: Building2,   title: "Home Addition", subtitle: "New footage" },
    ],
    chipLabel: "WHAT ARE YOU INCLUDING?",
    chips: [
      { id: "kitchen",  icon: UtensilsCrossed, label: "KITCHEN" },
      { id: "baths",    icon: Droplets,        label: "BATHS" },
      { id: "flooring", icon: Grid3x3,         label: "FLOORING" },
      { id: "layout",   icon: LayoutGrid,      label: "LAYOUT" },
    ],
  },
  addition: {
    icon: Building2,
    tabLabel: "Addition",
    headlinePrefix: "Calculate your room",
    headlineAccent: "addition",
    headlineSuffix: "cost",
    subtypeLabel: "WHAT ARE YOU ADDING?",
    subtypes: [
      { id: "bedroom-suite", icon: Bed,      title: "Bedroom Suite", subtitle: "Bed + bath" },
      { id: "sunroom",       icon: Sun,      title: "Sunroom",       subtitle: "Bright + airy" },
      { id: "great-room",    icon: Sofa,     title: "Great Room",    subtitle: "Living space" },
      { id: "second-story",  icon: Layers,   title: "Second Story",  subtitle: "Add a level" },
    ],
    chipLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "foundation", icon: Layers,    label: "FOUNDATION" },
      { id: "framing",    icon: Frame,     label: "FRAMING" },
      { id: "roofing",    icon: Triangle,  label: "ROOFING" },
      { id: "hvac",       icon: Wind,      label: "HVAC" },
    ],
  },
  adu: {
    icon: Building2,
    tabLabel: "ADU",
    headlinePrefix: "Calculate your",
    headlineAccent: "ADU",
    headlineSuffix: "cost",
    subtypeLabel: "YOUR ADU TYPE",
    subtypes: [
      { id: "attached",      icon: Home,      title: "Attached",      subtitle: "Shares a wall" },
      { id: "garage",        icon: Car,       title: "Garage",        subtitle: "Convert existing" },
      { id: "detached",      icon: Building2, title: "Detached",      subtitle: "Standalone build" },
      { id: "above-garage",  icon: Layers,    title: "Above Garage",  subtitle: "Second story" },
    ],
    chipLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "kitchen",  icon: UtensilsCrossed, label: "KITCHEN" },
      { id: "bath",     icon: Droplets,        label: "BATH" },
      { id: "bedroom",  icon: Bed,             label: "BEDROOM" },
      { id: "living",   icon: Sofa,            label: "LIVING" },
    ],
  },
  basement: {
    icon: Layers,
    tabLabel: "Basement",
    headlinePrefix: "Calculate your",
    headlineAccent: "basement",
    headlineSuffix: "finishing cost",
    subtypeLabel: "HOW WILL YOU USE IT?",
    subtypes: [
      { id: "family-room",  icon: Sofa,    title: "Family Room",  subtitle: "Living space" },
      { id: "home-theater", icon: Monitor, title: "Home Theater", subtitle: "Media room" },
      { id: "guest-suite",  icon: Bed,     title: "Guest Suite",  subtitle: "Bed + bath" },
      { id: "gym-flex",     icon: Dumbbell,title: "Gym / Flex",   subtitle: "Workout space" },
    ],
    chipLabel: "WHAT'S INCLUDED?",
    chips: [
      { id: "egress",   icon: DoorOpen,   label: "EGRESS" },
      { id: "bath",     icon: Droplets,   label: "BATH" },
      { id: "wet-bar",  icon: GlassWater, label: "WET BAR" },
      { id: "flooring", icon: Grid3x3,    label: "FLOORING" },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   REFINEMENT BUILDER
   Translates subtype seeds + chip selections into EstimateRefinements.
═══════════════════════════════════════════════════════════════════════ */

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
      const peDrivers = (addOns.includes("counters") ? 1 : 0) + (addOns.includes("lighting") ? 1 : 0);
      if (addOns.length >= 4) ref.plumbingElectrical = "full";
      else if (peDrivers >= 2 || addOns.includes("counters")) ref.plumbingElectrical = "partial";
      break;
    }
    case "bathroom": {
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1) ref.plumbingElectrical = "partial";
      break;
    }
    case "whole-home": {
      if (addOns.includes("layout") && !ref.layoutChanges) ref.layoutChanges = "moderate";
      if (addOns.includes("kitchen") && addOns.includes("baths")) {
        ref.plumbingElectrical = addOns.length >= 3 ? "full" : "partial";
      }
      break;
    }
    case "addition": {
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.length >= 1 && !ref.plumbingElectrical) ref.plumbingElectrical = "partial";
      break;
    }
    case "adu": {
      if (addOns.length >= 3) ref.plumbingElectrical = "full";
      else if (addOns.includes("kitchen") && addOns.includes("bath")) ref.plumbingElectrical = "partial";
      break;
    }
    case "basement": {
      if (addOns.includes("bath") && addOns.includes("wet-bar")) ref.plumbingElectrical = "full";
      else if (addOns.includes("bath") && !ref.plumbingElectrical) ref.plumbingElectrical = "partial";
      break;
    }
  }

  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED DARK UI PRIMITIVES
═══════════════════════════════════════════════════════════════════════ */

function DarkLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[9px] tracking-[0.18em] uppercase text-inverse-muted font-normal mb-3", className)}>
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */

interface EstimateCalculatorProps {
  inModal?: boolean;
  onBookVisit?: () => void;
}

export function EstimateCalculator({
  inModal = false,
  onBookVisit: onBookVisitProp,
}: EstimateCalculatorProps = {}) {

  /* ── State ── */
  const [step, setStep] = useState(0); // 0=project 1=subtype 2=finish+size 3=addons
  const [showResult, setShowResult] = useState(false); // mobile result reveal
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [finish, setFinish] = useState<FinishLevel>("mid-range");
  const [sqft, setSqft] = useState<number | null>(null);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  /* ── Derived ── */
  const effectiveProject = useMemo<ProjectType | null>(() => {
    if (!projectType || !subtype) return projectType;
    return SUBTYPE_DATA[projectType]?.[subtype]?.projectOverride ?? projectType;
  }, [projectType, subtype]);

  const refinements = useMemo<EstimateRefinements>(() => {
    if (!effectiveProject || !subtype || !projectType) return { ...EMPTY_REFINEMENTS };
    const data = SUBTYPE_DATA[projectType]?.[subtype];
    if (!data) return { ...EMPTY_REFINEMENTS };
    return buildRefinements(effectiveProject, subtype, addOns, data.refinements);
  }, [effectiveProject, projectType, subtype, addOns]);

  const userRefinementCount = useMemo(() => {
    if (!effectiveProject) return 0;
    return countVisibleUserRefinements(effectiveProject, getSetRefinementKeys(refinements));
  }, [effectiveProject, refinements]);

  const result = useMemo<EstimateResult | null>(() => {
    if (!effectiveProject || !sqft) return null;
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    return calculateEstimate(input, userRefinementCount);
  }, [effectiveProject, finish, sqft, refinements, userRefinementCount]);

  /* ── Persist estimate to sessionStorage ── */
  useEffect(() => {
    if (!result || !effectiveProject || !sqft) return;
    const input: EstimateInput = { project: effectiveProject, finish, sqft, refinements };
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify(buildStoredEstimate(input, userRefinementCount)),
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
  }, [result, effectiveProject, finish, sqft, refinements, userRefinementCount]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  /* ── Handlers ── */
  function autoAdvance(to: number) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep(to), 220);
  }

  function handleSelectProject(type: ProjectType) {
    if (type !== projectType) {
      setProjectType(type);
      setSubtype(null);
      setSqft(null);
      setAddOns([]);
      setShowResult(false);
      setScopeOpen(false);
      const avail = getAvailableFinishLevels(type);
      if (!avail.includes(finish)) setFinish("mid-range");
    }
    autoAdvance(1);
  }

  function handleSelectSubtype(id: string) {
    setSubtype(id);
    if (projectType) {
      const data = SUBTYPE_DATA[projectType]?.[id];
      if (data) setSqft(data.sqft);
    }
    setAddOns([]);
    setShowResult(false);
    setScopeOpen(false);
    autoAdvance(2);
  }

  function toggleChip(id: string) {
    setAddOns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleBookVisit() {
    if (onBookVisitProp) {
      onBookVisitProp();
    } else {
      document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ── Derived config ── */
  const config = projectType ? PROJECT_CONFIGS[projectType] : null;
  const availFinish = projectType ? getAvailableFinishLevels(projectType) : (["mid-range", "high-end", "luxury"] as FinishLevel[]);
  const sizePresets = effectiveProject ? getSizePresets(effectiveProject) : null;
  const sizeConfig = effectiveProject ? getProjectSizeConfig(effectiveProject) : null;

  const canProgress =
    step === 0 ? projectType !== null :
    step === 1 ? subtype !== null :
    step === 2 ? sqft !== null :
    true;

  const TOTAL_STEPS = 4;

  /* ── Shared card style ── */
  const darkCard = (active: boolean) =>
    cn(
      "relative rounded-md border text-left transition-all hover-elevate",
      active
        ? "bg-inverse-foreground/[0.18] border-inverse-foreground/50"
        : "bg-inverse-foreground/[0.07] border-inverse-foreground/[0.13]",
    );

  /* ══════════════════════════════════════════
     STEP RENDERS
  ══════════════════════════════════════════ */

  function renderProjectStep() {
    return (
      <div>
        <DarkLabel>SELECT YOUR PROJECT</DarkLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(PROJECT_CONFIGS) as ProjectType[]).map((type) => {
            const pc = PROJECT_CONFIGS[type];
            const Icon = pc.icon;
            const active = projectType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectProject(type)}
                data-testid={`calc-project-${type}`}
                aria-pressed={active}
                className={cn(darkCard(active), "flex flex-col items-start gap-1 p-3")}
              >
                {active && <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-accent-legible" />}
                <Icon className="h-5 w-5 text-accent-legible mb-0.5 flex-shrink-0" />
                <span className="text-[13px] font-normal text-inverse-foreground leading-tight">
                  {pc.tabLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSubtypeStep() {
    if (!config) return null;
    return (
      <div>
        <DarkLabel>{config.subtypeLabel}</DarkLabel>
        <div className="grid grid-cols-2 gap-2.5">
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
                className={cn(darkCard(active), "flex items-start gap-3 p-3")}
              >
                {active && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-legible flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-inverse" />
                  </span>
                )}
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent-legible" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-inverse-foreground leading-tight">
                    {opt.title}
                  </span>
                  <span className="block text-[11px] italic text-inverse-muted leading-snug mt-0.5">
                    {opt.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const FINISH_META: Record<FinishLevel, { label: string; sub: string }> = {
    refresh:     { label: "Refresh",    sub: "Cosmetic" },
    "mid-range": { label: "Mid-Range",  sub: "Best value" },
    "high-end":  { label: "High-End",   sub: "Premium" },
    luxury:      { label: "Luxury",     sub: "No limit" },
  };

  function renderFinishSizeStep() {
    return (
      <div className="space-y-5">
        {/* Finish level */}
        <div>
          <DarkLabel>FINISH LEVEL</DarkLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availFinish.map((level) => {
              const meta = FINISH_META[level];
              const active = finish === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFinish(level)}
                  data-testid={`calc-finish-${level}`}
                  aria-pressed={active}
                  className={cn(darkCard(active), "flex flex-col items-center text-center py-2.5 px-2")}
                >
                  {active && <Check className="h-3 w-3 text-accent-legible mb-1" />}
                  <span className="text-[12px] font-medium text-inverse-foreground">{meta.label}</span>
                  <span className="text-[10px] text-inverse-muted">{meta.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size */}
        <div>
          <DarkLabel>PROJECT SIZE</DarkLabel>
          {sizePresets ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {sizePresets.map((preset) => {
                  const active = sqft === preset.sqft;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSqft(preset.sqft)}
                      data-testid={`calc-size-${preset.id}`}
                      aria-pressed={active}
                      className={cn(darkCard(active), "flex flex-col items-center text-center py-2.5 px-2")}
                    >
                      <span className="text-[12px] font-medium text-inverse-foreground">{preset.label}</span>
                      <span className="text-[10px] text-inverse-muted">
                        ~{preset.sqft.toLocaleString()} sqft
                      </span>
                    </button>
                  );
                })}
              </div>
              {sqft !== null && sizeConfig && (
                <div className="animate-in fade-in duration-200 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-inverse-muted">Fine-tune</span>
                    <span className="text-inverse-foreground brc-display-num">
                      {sqft.toLocaleString()} sqft
                    </span>
                  </div>
                  <input
                    type="range"
                    className="brc-slider w-full"
                    min={sizeConfig.min}
                    max={sizeConfig.max}
                    step={sizeConfig.step}
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    data-testid="calc-slider-size"
                    aria-label="Project size"
                    aria-valuemin={sizeConfig.min}
                    aria-valuemax={sizeConfig.max}
                    aria-valuenow={sqft}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-inverse-muted">
              Choose a project and subtype first.
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderAddOnsStep() {
    if (!config) return null;
    return (
      <div>
        <DarkLabel>{config.chipLabel}</DarkLabel>
        <div className="grid grid-cols-4 gap-2">
          {config.chips.map((chip) => {
            const Icon = chip.icon;
            const active = addOns.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleChip(chip.id)}
                data-testid={`calc-chip-${chip.id}`}
                aria-pressed={active}
                className={cn(
                  darkCard(active),
                  "flex flex-col items-center justify-center gap-1.5 py-3 px-1 text-center",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-accent-legible" : "text-inverse-muted",
                  )}
                />
                <span className="text-[9px] tracking-widest uppercase text-inverse-foreground leading-tight">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-inverse-muted mt-3 leading-relaxed">
          Optional - tap to toggle. These sharpen your estimate range.
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     RESULT PANEL (shared by mobile + desktop)
  ══════════════════════════════════════════ */

  function ResultPanel({ compact = false }: { compact?: boolean }) {
    if (!result) {
      return (
        <div className="space-y-3" data-testid="estimate-result-pending">
          <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted">Planning range</p>
          <div
            className="brc-display-num text-[clamp(28px,5vw,44px)] leading-none text-inverse-muted/40"
            data-testid="estimate-range-placeholder"
          >
            $ -- to --
          </div>
          <p className="text-[12px] text-inverse-muted leading-relaxed">
            Complete the steps to see your personalized planning range.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4" data-testid="estimate-result-panel">
        <p className="text-[9px] tracking-[0.18em] uppercase text-inverse-muted">Planning range</p>

        {/* Price range */}
        <div
          className="brc-display-num tabular-nums leading-none text-inverse-foreground"
          style={{ fontSize: compact ? "clamp(26px,4vw,36px)" : "clamp(30px,6vw,52px)" }}
          data-testid="estimate-range"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatedPrice value={result.priceLow} />
          <span className="text-inverse-muted/60 mx-1.5" style={{ fontSize: "0.55em" }}>
            to
          </span>
          <AnimatedPrice value={result.priceHigh} />
        </div>

        <p className="text-[11px] text-inverse-muted leading-snug">
          Est. {result.roi}% ROI based on Boise market data.
        </p>

        {/* Scope toggle */}
        <div className="border-t border-inverse-foreground/10 pt-3">
          <button
            type="button"
            onClick={() => setScopeOpen((p) => !p)}
            className="flex w-full items-center justify-between text-left py-0.5"
            data-testid="button-toggle-scope"
            aria-expanded={scopeOpen}
          >
            <span className="text-[10px] tracking-wide text-inverse-muted">
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
                  className="flex items-start gap-2 text-[11px] text-inverse-muted leading-snug"
                  data-testid={`included-item-${i}`}
                >
                  <Check className="h-3 w-3 flex-shrink-0 mt-0.5 text-accent-legible" />
                  {item}
                </div>
              ))}
              <p className="text-[10px] text-inverse-muted/70 pt-1 leading-relaxed">
                {INCLUDED_SCOPE_NOTE}
              </p>
              {effectiveProject === "kitchen" && (
                <p className="text-[10px] text-inverse-muted/70 leading-relaxed">
                  {APPLIANCE_DISCLAIMER}
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={handleBookVisit}
          data-testid="button-book-visit"
          className="w-full bg-inverse-foreground text-inverse tracking-wide"
        >
          Schedule a free visit
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-[10px] text-center text-inverse-muted/70">
          Free 60 to 90 min in-home visit. No obligation.
        </p>

        {/* Legal note */}
        <button
          type="button"
          onClick={() => setLegalOpen((p) => !p)}
          className="flex w-full items-center justify-center gap-1 text-[10px] text-inverse-muted/60 hover:text-inverse-muted"
          aria-expanded={legalOpen}
        >
          Why a range, not a fixed price?
          <ChevronDown className={cn("h-3 w-3 transition-transform", legalOpen && "rotate-180")} />
        </button>
        {legalOpen && (
          <p className="text-[10px] text-inverse-muted/70 leading-relaxed">
            This estimate is for planning purposes only - not a proposal, bid, or guaranteed project
            cost. Ranges reflect project type, size, location, finish level, and other assumptions.
            Your consultation delivers a detailed evaluation tailored to your home.
          </p>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     HEADLINE
  ══════════════════════════════════════════ */

  function Headline() {
    const headlineSize =
      "font-sans font-light text-[clamp(1.5rem,3.5vw,2.75rem)] leading-[1.1] tracking-tight text-inverse-foreground";

    if (!config) {
      return (
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-inverse-muted mb-2">
            BALLPARK YOUR PROJECT IN UNDER 60 SECONDS
          </p>
          <h2 className={headlineSize}>
            Get your <em className="brc-accent">instant</em> estimate
          </h2>
        </div>
      );
    }
    return (
      <div>
        <p className="text-[9px] tracking-[0.2em] uppercase text-inverse-muted mb-2">
          BALLPARK YOUR PROJECT IN UNDER 60 SECONDS
        </p>
        <h2 className={headlineSize}>
          {config.headlinePrefix}{" "}
          <em className="brc-accent">{config.headlineAccent}</em>{" "}
          {config.headlineSuffix}
        </h2>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     STEP DOTS
  ══════════════════════════════════════════ */

  function StepDots() {
    return (
      <div className="flex items-center gap-1.5" role="list" aria-label="Estimator progress">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            role="listitem"
            className={cn(
              "rounded-full transition-all duration-300",
              i === step && !showResult
                ? "w-5 h-1.5 bg-inverse-foreground/70"
                : i < step || showResult
                  ? "w-1.5 h-1.5 bg-accent-legible"
                  : "w-1.5 h-1.5 bg-inverse-foreground/20",
            )}
          />
        ))}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     BOTTOM CTA
  ══════════════════════════════════════════ */

  function BottomCta() {
    if (showResult) {
      return (
        <div className="flex items-center justify-center pt-4">
          <button
            type="button"
            onClick={() => { setShowResult(false); setStep(3); }}
            className="text-[11px] text-inverse-muted hover:text-inverse-foreground transition-colors"
          >
            Edit selections
          </button>
        </div>
      );
    }

    const isLast = step === 3;
    const btnClass =
      "tracking-widest text-[11px] uppercase font-normal bg-inverse-foreground text-inverse disabled:opacity-40";

    return (
      <div className="space-y-2 pt-4">
        {/* Mobile */}
        <Button
          disabled={!canProgress}
          onClick={() => {
            if (!canProgress) return;
            if (isLast) {
              setShowResult(true);
            } else {
              setStep((s) => s + 1);
            }
          }}
          className={cn("w-full lg:hidden", btnClass)}
          data-testid={isLast ? "button-calculate" : "button-continue"}
        >
          {isLast ? "Calculate My Cost" : "Continue"}
        </Button>

        {/* Desktop */}
        {isLast ? (
          <Button
            onClick={handleBookVisit}
            className={cn("w-full hidden lg:flex", btnClass)}
            data-testid="button-schedule-desktop"
          >
            Schedule a Free Visit
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={!canProgress}
            onClick={() => { if (canProgress) setStep((s) => s + 1); }}
            className={cn("w-full hidden lg:flex", btnClass)}
            data-testid="button-continue-desktop"
          >
            Continue
          </Button>
        )}

        {/* Skip on add-ons step */}
        {isLast && !showResult && (
          <button
            type="button"
            onClick={() => {
              setShowResult(true);
            }}
            className="w-full lg:hidden text-[10px] text-center text-inverse-muted py-1"
          >
            Skip - see my estimate
          </button>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     WIZARD CONTENT
  ══════════════════════════════════════════ */

  function WizardContent() {
    if (showResult) {
      return <ResultPanel />;
    }
    switch (step) {
      case 0: return renderProjectStep();
      case 1: return renderSubtypeStep();
      case 2: return renderFinishSizeStep();
      case 3: return renderAddOnsStep();
      default: return null;
    }
  }

  /* ══════════════════════════════════════════
     MODAL LAYOUT (compact, no min-h-screen)
  ══════════════════════════════════════════ */

  if (inModal) {
    return (
      <div className="bg-inverse text-inverse-foreground rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          {step > 0 && !showResult ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center gap-1 text-inverse-muted text-[12px] hover:text-inverse-foreground transition-colors"
              data-testid="button-back-modal"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <span />}
          <StepDots />
        </div>
        <div className="mb-5"><Headline /></div>
        <div className="mb-5"><WizardContent /></div>
        <BottomCta />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     INLINE LAYOUT (full-viewport dark section)
  ══════════════════════════════════════════ */

  return (
    <Section
      id="calculator"
      variant="inverse"
      spacing="none"
      divider
      style={{ minHeight: "100dvh" } as React.CSSProperties}
      className="flex flex-col"
    >
      <div className="container px-4 flex flex-col lg:flex-row gap-0 lg:gap-12 xl:gap-16 flex-1">

        {/* ── WIZARD PANEL ── */}
        <div className="flex-1 flex flex-col py-16 lg:py-20 min-h-0">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            {step > 0 && !showResult ? (
              <button
                type="button"
                onClick={() => {
                  if (showResult) { setShowResult(false); }
                  else { setStep((s) => Math.max(0, s - 1)); }
                }}
                className="flex items-center gap-1 text-inverse-muted text-[12px] hover:text-inverse-foreground transition-colors"
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <span />
            )}
            <StepDots />
          </div>

          {/* Headline */}
          <div className="mb-6 flex-shrink-0">
            <Headline />
          </div>

          {/* Step content */}
          <div
            key={`${step}-${showResult}`}
            className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"
          >
            <WizardContent />
          </div>

          {/* Bottom CTA */}
          <div className="flex-shrink-0 mt-8 max-w-sm">
            <BottomCta />
          </div>
        </div>

        {/* ── RESULT PANEL (desktop right column) ── */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 flex-col justify-center flex-shrink-0 py-20">
          <div className="sticky top-24">
            <ResultPanel compact />
          </div>
        </div>
      </div>
    </Section>
  );
}
