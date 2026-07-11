"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisplayNum, Section } from "@/components/marketing";
import { EstimateResultPanel } from "@/components/estimate/EstimateResultPanel";
import { StickyEstimateBar } from "@/components/estimate/StickyEstimateBar";
import {
  type ProjectType,
  type FinishLevel,
  type EstimateRefinements,
  type EstimateInput,
  type PartialEstimateInput,
  EMPTY_REFINEMENTS,
  PROJECT_LABELS,
  FINISH_LABELS,
  getProjectSizeConfig,
  getAvailableFinishLevels,
  getMaxRefinementFields,
  getRefinementVisibility,
  getSetRefinementKeys,
  getSizePresets,
  countVisibleUserRefinements,
  getPlumbingElectricalLabel,
  getPlumbingElectricalOptions,
  getFinishPlanningHint,
  buildSelectionSummary,
  calculateEstimate,
  buildStoredEstimate,
  isCompleteEstimateInput,
} from "@/shared/estimateEngine";

/* ─────────────────────────── Step model ─────────────────────────── */

type StepId = "project" | "finish" | "size" | "refine" | "review";

const STEPS: { id: StepId; title: string; shortLabel: string }[] = [
  { id: "project", title: "What are we remodeling?", shortLabel: "Project" },
  { id: "finish", title: "Choose a finish level", shortLabel: "Finish" },
  { id: "size", title: "How big is the space?", shortLabel: "Size" },
  { id: "refine", title: "Tailor your range (optional)", shortLabel: "Details" },
  { id: "review", title: "Your planning range", shortLabel: "Review" },
];

const STEP_INDEX: Record<StepId, number> = {
  project: 0,
  finish: 1,
  size: 2,
  refine: 3,
  review: 4,
};

/* ─────────────────────────── Choice tiles ─────────────────────────── */

function SelectButton<T extends string>({
  value,
  options,
  onChange,
  testIdPrefix,
  allowUnset,
  disabled,
  groupLabelId,
}: {
  value: T | null;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T | null) => void;
  testIdPrefix: string;
  allowUnset?: boolean;
  disabled?: boolean;
  groupLabelId?: string;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="group"
      aria-labelledby={groupLabelId}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active && allowUnset ? null : opt.value)}
            data-testid={`${testIdPrefix}-${opt.value}`}
            aria-pressed={active}
            className={cn(
              "relative flex min-h-11 flex-col items-start gap-1 p-4 rounded-sm text-left transition-all border bg-card",
              active ? "border-accent-legible border-[1.5px] bg-accent-legible/10" : "border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {active && (
              <Check className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-accent-legible" />
            )}
            <span className="font-normal text-xs text-foreground">{opt.label}</span>
            {opt.sub && (
              <span className="text-[11px] leading-snug text-muted-foreground">{opt.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RefinementNumberInput({
  id,
  label,
  min,
  max,
  placeholder,
  value,
  onCommit,
  testId,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  placeholder: string;
  value: number | null;
  onCommit: (n: number | null) => void;
  testId: string;
}) {
  const [text, setText] = useState(value !== null ? String(value) : "");
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));

  useEffect(() => {
    setText(value !== null ? String(value) : "");
  }, [value]);

  return (
    <div>
      <label htmlFor={id} className="brc-label mb-3">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw === "") {
            onCommit(null);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onCommit(clamp(n));
        }}
        onBlur={() => {
          if (text === "") {
            onCommit(null);
            return;
          }
          const n = Number(text);
          if (Number.isFinite(n)) {
            const c = clamp(n);
            setText(String(c));
            onCommit(c);
          } else {
            setText("");
            onCommit(null);
          }
        }}
        data-testid={testId}
      />
    </div>
  );
}

/* ─────────────────────── Shared step contents ─────────────────────── */

function ProjectTiles({
  project,
  onSelect,
  idPrefix,
}: {
  project: ProjectType | null;
  onSelect: (type: ProjectType) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(PROJECT_LABELS) as ProjectType[]).map((type) => {
        const info = PROJECT_LABELS[type];
        const active = project === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            data-testid={`${idPrefix}button-project-${type}`}
            aria-pressed={active}
            className={cn(
              "relative flex min-h-11 flex-col items-start gap-1.5 p-5 rounded-sm text-left transition-all border bg-card",
              active ? "border-accent-legible border-[1.5px] bg-accent-legible/10" : "border-border"
            )}
          >
            {active && <Check className="absolute top-3 right-3 h-4 w-4 text-accent-legible" />}
            <span className="font-normal text-sm text-foreground">{info.label}</span>
            <span className="text-xs text-muted-foreground">{info.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function FinishTiles({
  project,
  finish,
  onSelect,
  idPrefix,
}: {
  project: ProjectType | null;
  finish: FinishLevel | null;
  onSelect: (level: FinishLevel) => void;
  idPrefix: string;
}) {
  const levels = project
    ? getAvailableFinishLevels(project)
    : (Object.keys(FINISH_LABELS) as FinishLevel[]);
  const disabled = project === null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {levels.map((level) => {
        const info = FINISH_LABELS[level];
        const active = finish === level;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(level)}
            data-testid={`${idPrefix}button-finish-${level}`}
            aria-pressed={active}
            className={cn(
              "relative flex min-h-11 flex-col items-start gap-1.5 p-5 rounded-sm text-left transition-all border bg-card",
              active ? "border-accent-legible border-[1.5px] bg-accent-legible/10" : "border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {active && <Check className="absolute top-3 right-3 h-4 w-4 text-accent-legible" />}
            <span className="font-normal text-sm text-foreground">{info.label}</span>
            <span className="text-xs text-muted-foreground">{info.sub}</span>
            {project && (
              <span className="text-[11px] leading-snug text-muted-foreground/90 mt-0.5">
                {getFinishPlanningHint(project, level)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SizePicker({
  project,
  sqft,
  onSqftChange,
  idPrefix,
}: {
  project: ProjectType | null;
  sqft: number | null;
  onSqftChange: (n: number) => void;
  idPrefix: string;
}) {
  const presets = project ? getSizePresets(project) : null;
  const sizeConfig = project ? getProjectSizeConfig(project) : null;

  const sliderPct =
    sizeConfig && sqft !== null
      ? ((sqft - sizeConfig.min) / (sizeConfig.max - sizeConfig.min)) * 100
      : 0;
  const sliderBackground = `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${sliderPct}%, hsl(var(--border)) ${sliderPct}%, hsl(var(--border)) 100%)`;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4" role="group" aria-label="Approximate size">
        {(presets ?? [
          { id: "smaller" as const, label: "Smaller", sub: "", sqft: 0 },
          { id: "typical" as const, label: "Typical", sub: "", sqft: 0 },
          { id: "larger" as const, label: "Larger", sub: "", sqft: 0 },
        ]).map((preset) => {
          const active = sqft !== null && presets !== null && sqft === preset.sqft;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={!presets}
              onClick={() => onSqftChange(preset.sqft)}
              data-testid={`${idPrefix}size-preset-${preset.id}`}
              aria-pressed={active}
              className={cn(
                "relative flex min-h-11 flex-col items-center gap-0.5 p-3 rounded-sm text-center transition-all border bg-card",
                active ? "border-accent-legible border-[1.5px] bg-accent-legible/10" : "border-border",
                !presets && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="font-normal text-xs text-foreground">{preset.label}</span>
              {presets && (
                <span className="text-[11px] text-muted-foreground">
                  ~{preset.sqft.toLocaleString()} sqft
                </span>
              )}
            </button>
          );
        })}
      </div>

      {sizeConfig && sqft !== null ? (
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs text-muted-foreground">Fine-tune the size</span>
            <DisplayNum className="text-2xl leading-none text-foreground">
              {sqft.toLocaleString()}{" "}
              <span className="text-sm font-sans text-muted-foreground">sqft</span>
            </DisplayNum>
          </div>
          <input
            type="range"
            className="brc-slider"
            min={sizeConfig.min}
            max={sizeConfig.max}
            step={sizeConfig.step}
            value={sqft}
            onChange={(e) => onSqftChange(Number(e.target.value))}
            style={{ background: sliderBackground }}
            data-testid={`${idPrefix}slider-size`}
            aria-label={`Project size in square feet${project ? ` for ${PROJECT_LABELS[project].label}` : ""}`}
            aria-valuemin={sizeConfig.min}
            aria-valuemax={sizeConfig.max}
            aria-valuenow={sqft}
          />
          <div className="flex justify-between text-[11px] mt-2 tracking-wide text-muted-foreground">
            <span>
              <DisplayNum>{sizeConfig.min.toLocaleString()}</DisplayNum> sqft
            </span>
            <span>
              <DisplayNum>{sizeConfig.max.toLocaleString()}</DisplayNum> sqft
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {project
            ? "Pick a starting point above, then fine-tune with the slider."
            : "Choose a project type first."}
        </p>
      )}
    </div>
  );
}

function RefinementFields({
  project,
  refinements,
  onUpdate,
  idPrefix,
}: {
  project: ProjectType;
  refinements: EstimateRefinements;
  onUpdate: <K extends keyof EstimateRefinements>(key: K, value: EstimateRefinements[K]) => void;
  idPrefix: string;
}) {
  const visibility = getRefinementVisibility(project);

  return (
    <div className="space-y-6">
      {visibility.layoutChanges && (
        <div>
          <span id={`${idPrefix}label-layout`} className="brc-label mb-3">
            Layout changes
          </span>
          <SelectButton
            value={refinements.layoutChanges}
            onChange={(v) => onUpdate("layoutChanges", v)}
            testIdPrefix={`${idPrefix}layout`}
            allowUnset
            groupLabelId={`${idPrefix}label-layout`}
            options={[
              { value: "none", label: "None", sub: "Same layout" },
              { value: "moderate", label: "Moderate", sub: "Minor wall changes" },
              { value: "major", label: "Major", sub: "Structural changes" },
            ]}
          />
        </div>
      )}

      {visibility.plumbingElectrical && (
        <div>
          <span id={`${idPrefix}label-plumbing`} className="brc-label mb-3">
            {getPlumbingElectricalLabel(project)}
          </span>
          <SelectButton
            value={refinements.plumbingElectrical}
            onChange={(v) => onUpdate("plumbingElectrical", v)}
            testIdPrefix={`${idPrefix}plumbing`}
            allowUnset
            groupLabelId={`${idPrefix}label-plumbing`}
            options={getPlumbingElectricalOptions(project)}
          />
        </div>
      )}

      {visibility.cabinetTier && (
        <div>
          <span id={`${idPrefix}label-cabinet`} className="brc-label mb-3">
            Cabinet level
          </span>
          <SelectButton
            value={refinements.cabinetTier}
            onChange={(v) => onUpdate("cabinetTier", v)}
            testIdPrefix={`${idPrefix}cabinet`}
            allowUnset
            groupLabelId={`${idPrefix}label-cabinet`}
            options={[
              { value: "standard", label: "Standard" },
              { value: "semi-custom", label: "Semi-custom" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
      )}

      {visibility.fixtureCount && (
        <RefinementNumberInput
          id={`${idPrefix}fixture-count`}
          label="Number of fixtures"
          min={1}
          max={8}
          placeholder="e.g. 3"
          value={refinements.fixtureCount}
          onCommit={(n) => onUpdate("fixtureCount", n)}
          testId={`${idPrefix}input-fixture-count`}
        />
      )}

      {visibility.roomCount && (
        <RefinementNumberInput
          id={`${idPrefix}room-count`}
          label="Rooms being remodeled"
          min={1}
          max={12}
          placeholder="e.g. 4"
          value={refinements.roomCount}
          onCommit={(n) => onUpdate("roomCount", n)}
          testId={`${idPrefix}input-room-count`}
        />
      )}

      {visibility.stories && (
        <div>
          <span id={`${idPrefix}label-stories`} className="brc-label mb-3">
            Stories involved
          </span>
          <SelectButton
            value={refinements.stories !== null ? (String(refinements.stories) as "1" | "2") : null}
            onChange={(v) => onUpdate("stories", v === null ? null : Number(v))}
            testIdPrefix={`${idPrefix}stories`}
            allowUnset
            groupLabelId={`${idPrefix}label-stories`}
            options={[
              { value: "1", label: "Single story" },
              { value: "2", label: "Two story" },
            ]}
          />
        </div>
      )}

      {visibility.aduConfiguration && (
        <div>
          <span id={`${idPrefix}label-adu-type`} className="brc-label mb-3">
            ADU configuration
          </span>
          <SelectButton
            value={refinements.aduConfig}
            onChange={(v) => onUpdate("aduConfig", v)}
            testIdPrefix={`${idPrefix}adu-type`}
            allowUnset
            groupLabelId={`${idPrefix}label-adu-type`}
            options={[
              { value: "detached", label: "Detached", sub: "Separate structure on lot" },
              { value: "attached", label: "Attached", sub: "Connected to main home" },
            ]}
          />
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Every detail is optional. Tap a selected option again to clear it.
      </p>
    </div>
  );
}

function StepHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full border border-primary/60 text-primary text-[11px] font-normal tracking-wide">
        {num}
      </span>
      <span className="font-sans font-normal text-sm text-foreground tracking-wide">{label}</span>
    </div>
  );
}

/* ─────────────────────────── Calculator ─────────────────────────── */

interface EstimateCalculatorProps {
  inModal?: boolean;
  onBookVisit?: () => void;
}

export function EstimateCalculator({ inModal = false, onBookVisit: onBookVisitProp }: EstimateCalculatorProps = {}) {
  // Nothing is selected by default; users build the estimate intentionally.
  const [project, setProject] = useState<ProjectType | null>(null);
  const [finish, setFinish] = useState<FinishLevel | null>(null);
  const [sqft, setSqft] = useState<number | null>(null);
  const [refinements, setRefinements] = useState<EstimateRefinements>({ ...EMPTY_REFINEMENTS });
  const [refineOpen, setRefineOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const input: PartialEstimateInput = useMemo(
    () => ({ project, finish, sqft, refinements }),
    [project, finish, sqft, refinements]
  );

  const complete = isCompleteEstimateInput(input);

  const userRefinementCount = project
    ? countVisibleUserRefinements(project, getSetRefinementKeys(refinements))
    : 0;

  const result = useMemo(
    () => (complete ? calculateEstimate(input as EstimateInput, userRefinementCount) : null),
    [complete, input, userRefinementCount]
  );

  const progress = {
    project: project !== null,
    finish: finish !== null,
    size: sqft !== null,
  };

  const selectionSummary = complete
    ? buildSelectionSummary(input.project as ProjectType, input.finish as FinishLevel, input.sqft as number)
    : [
        project && PROJECT_LABELS[project].label,
        finish && FINISH_LABELS[finish].label,
        sqft !== null && `${sqft.toLocaleString()} sqft`,
      ]
        .filter(Boolean)
        .join(" · ") || "Project estimator";

  /* ── Step navigation (mobile / modal guided flow) ── */

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocusRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);

  const canEnterStep = useCallback(
    (index: number): boolean => {
      switch (STEPS[index].id) {
        case "project":
          return true;
        case "finish":
          return project !== null;
        case "size":
          return project !== null && finish !== null;
        case "refine":
        case "review":
          return complete;
        default:
          return false;
      }
    },
    [project, finish, complete]
  );

  const goToStep = useCallback(
    (index: number, focusHeading = true) => {
      setStepIndex((prev) => {
        if (index === prev) return prev;
        pendingFocusRef.current = focusHeading;
        return index;
      });
    },
    []
  );

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    pendingFocusRef.current = false;
    // Orient keyboard / screen-reader users (and scroll the step into view).
    stepHeadingRef.current?.focus();
  }, [stepIndex]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  /** Brief pause so the selected state is perceivable before advancing. */
  const advanceToStep = useCallback(
    (index: number) => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => goToStep(index), 180);
    },
    [goToStep]
  );

  /* ── Selection handlers ── */

  function handleSelectProject(type: ProjectType) {
    if (type !== project) {
      setProject(type);
      // Size and detail options are project-specific; clear them so nothing
      // carries over implicitly.
      setSqft(null);
      setRefinements({ ...EMPTY_REFINEMENTS });
      if (finish !== null && !getAvailableFinishLevels(type).includes(finish)) {
        setFinish(null);
      }
    }
    advanceToStep(STEP_INDEX.finish);
  }

  function handleSelectFinish(level: FinishLevel) {
    setFinish(level);
    advanceToStep(STEP_INDEX.size);
  }

  function updateRefinement<K extends keyof EstimateRefinements>(key: K, value: EstimateRefinements[K]) {
    setRefinements((prev) => ({ ...prev, [key]: value }));
  }

  function handleBookVisit() {
    if (!complete) return;
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify(buildStoredEstimate(input as EstimateInput, userRefinementCount))
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
    if (onBookVisitProp) {
      onBookVisitProp();
    } else {
      document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Persist only user-completed estimates; never write a range the user did
  // not intentionally build.
  useEffect(() => {
    if (!complete) return;
    sessionStorage.setItem(
      "brc_estimate",
      JSON.stringify(buildStoredEstimate(input as EstimateInput, userRefinementCount))
    );
    window.dispatchEvent(new CustomEvent("brc_estimate_updated"));
  }, [complete, input, userRefinementCount]);

  /* ── Inline sticky bar visibility ── */

  const sectionRef = useRef<HTMLDivElement>(null);
  const [calculatorInView, setCalculatorInView] = useState(false);

  useEffect(() => {
    if (inModal) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCalculatorInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inModal]);

  /* ── Sticky bar contextual CTA ── */

  const currentStep = STEPS[stepIndex];
  let barCtaLabel: string;
  let barCtaDisabled = false;
  let barCtaAction: () => void;

  switch (currentStep.id) {
    case "project":
      barCtaLabel = "Continue";
      barCtaDisabled = project === null;
      barCtaAction = () => goToStep(STEP_INDEX.finish);
      break;
    case "finish":
      barCtaLabel = "Continue";
      barCtaDisabled = finish === null;
      barCtaAction = () => goToStep(STEP_INDEX.size);
      break;
    case "size":
      barCtaLabel = "Continue";
      barCtaDisabled = sqft === null;
      barCtaAction = () => goToStep(STEP_INDEX.refine);
      break;
    case "refine":
      barCtaLabel = "Review estimate";
      barCtaAction = () => goToStep(STEP_INDEX.review);
      break;
    default:
      barCtaLabel = "Schedule a visit";
      barCtaAction = handleBookVisit;
  }

  /* ── Guided stepper (mobile + modal) ── */

  const stepperIdPrefix = "step-";
  const stepper = (
    <div data-testid="estimate-stepper">
      <div className="flex items-center justify-between gap-3 mb-4 min-h-9">
        {stepIndex > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(stepIndex - 1)}
            data-testid="button-step-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-wide uppercase text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <ol className="flex items-center gap-1.5" aria-label="Estimator progress">
            {STEPS.map((step, i) => {
              const reachable = canEnterStep(i);
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goToStep(i)}
                    aria-label={`Step ${i + 1}: ${step.shortLabel}`}
                    aria-current={i === stepIndex ? "step" : undefined}
                    className={cn(
                      "block rounded-full transition-all",
                      i === stepIndex
                        ? "w-5 h-1.5 bg-accent-legible"
                        : reachable
                          ? "w-1.5 h-1.5 bg-foreground/40"
                          : "w-1.5 h-1.5 bg-border"
                    )}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <h3
        ref={stepHeadingRef}
        tabIndex={-1}
        className="font-sans font-light text-xl text-foreground mb-5 outline-none scroll-mt-24"
        data-testid="step-heading"
      >
        {currentStep.title}
      </h3>

      <div
        key={currentStep.id}
        className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"
      >
        {currentStep.id === "project" && (
          <ProjectTiles project={project} onSelect={handleSelectProject} idPrefix={stepperIdPrefix} />
        )}

        {currentStep.id === "finish" && (
          <FinishTiles
            project={project}
            finish={finish}
            onSelect={handleSelectFinish}
            idPrefix={stepperIdPrefix}
          />
        )}

        {currentStep.id === "size" && (
          <SizePicker project={project} sqft={sqft} onSqftChange={setSqft} idPrefix={stepperIdPrefix} />
        )}

        {currentStep.id === "refine" && project && (
          <div>
            <p className="text-xs text-muted-foreground mb-5">
              A few optional details sharpen your planning range. Skip this step any time.
            </p>
            <RefinementFields
              project={project}
              refinements={refinements}
              onUpdate={updateRefinement}
              idPrefix={stepperIdPrefix}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground"
              onClick={() => goToStep(STEP_INDEX.review)}
              data-testid="button-skip-refine"
            >
              Skip for now
            </Button>
          </div>
        )}

        {currentStep.id === "review" && (
          <EstimateResultPanel
            result={result}
            selectionSummary={selectionSummary}
            onBookVisit={handleBookVisit}
            project={project}
            progress={progress}
          />
        )}
      </div>
    </div>
  );

  /* ── Stacked layout (desktop inline) ── */

  const stackedIdPrefix = "";
  const stacked = (
    <div className="space-y-8">
      <div>
        <StepHeader num={1} label="What are we remodeling?" />
        <ProjectTiles project={project} onSelect={handleSelectProject} idPrefix={stackedIdPrefix} />
      </div>

      <div>
        <StepHeader num={2} label="Choose a finish level" />
        {project === null && (
          <p className="text-xs text-muted-foreground mb-3">Choose a project type first.</p>
        )}
        <FinishTiles
          project={project}
          finish={finish}
          onSelect={handleSelectFinish}
          idPrefix={stackedIdPrefix}
        />
      </div>

      <div>
        <StepHeader num={3} label="How big is the space?" />
        <SizePicker project={project} sqft={sqft} onSqftChange={setSqft} idPrefix={stackedIdPrefix} />
      </div>

      <div className="rounded-sm overflow-hidden border border-border marketing-card">
        <button
          type="button"
          disabled={!complete}
          onClick={() => setRefineOpen(!refineOpen)}
          className={cn(
            "w-full flex items-center justify-between p-5 text-left bg-surface-muted hover:bg-muted/80 transition-colors",
            !complete && "opacity-50 cursor-not-allowed"
          )}
          data-testid="button-refine-toggle"
          aria-expanded={refineOpen && complete}
          aria-controls="refine-estimate-panel"
        >
          <div>
            <span className="font-normal text-sm block text-foreground">
              Improve estimate accuracy
            </span>
            <span className="text-xs text-muted-foreground">
              {complete
                ? "Add optional details for a more tailored planning range"
                : "Finish the three steps above to unlock"}
            </span>
            {refineOpen && complete && project && (
              <span className="text-[11px] block mt-1 text-muted-foreground">
                {userRefinementCount} of {getMaxRefinementFields(project)} details added
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 flex-shrink-0 transition-transform text-muted-foreground",
              refineOpen && complete && "rotate-180"
            )}
          />
        </button>

        {refineOpen && complete && project && (
          <div id="refine-estimate-panel" className="p-5 bg-card border-t border-border">
            <RefinementFields
              project={project}
              refinements={refinements}
              onUpdate={updateRefinement}
              idPrefix={stackedIdPrefix}
            />
          </div>
        )}
      </div>
    </div>
  );

  const resultPanel = (
    <EstimateResultPanel
      result={result}
      selectionSummary={selectionSummary}
      onBookVisit={handleBookVisit}
      project={project}
      progress={progress}
    />
  );

  /* ── Modal layout: guided stepper everywhere, side panel on md+ ── */

  if (inModal) {
    return (
      <div>
        <div className="grid md:grid-cols-[3fr_2fr] gap-6 md:gap-8 items-start">
          <div>{stepper}</div>
          <div className="hidden md:block">{resultPanel}</div>
        </div>
        <StickyEstimateBar
          mode="modal"
          result={result}
          summary={selectionSummary}
          ctaLabel={barCtaLabel}
          ctaDisabled={barCtaDisabled}
          onCta={barCtaAction}
        />
      </div>
    );
  }

  /* ── Inline layout: stepper on mobile, stacked two-column on desktop ── */

  return (
    <Section id="calculator" divider>
      <div ref={sectionRef} className="container px-4 pb-24 lg:pb-0">
        <div className="max-w-6xl mx-auto mb-10">
          <div className="brc-label mb-3">Project Estimator</div>
          <h2 className="font-sans font-light text-section-title md:text-section-title-lg mb-3 text-foreground">
            Plan your project{" "}
            <em className="brc-accent">investment</em>
          </h2>
          <p className="text-base max-w-2xl leading-relaxed text-muted-foreground mb-3">
            Answer three quick questions for an instant planning range. Nothing is pre-selected
            and nothing is submitted until you say so.
          </p>
          <p className="text-xs text-muted-foreground/90 max-w-2xl">
            Planning estimate only, not a binding quote. Final pricing requires an in-home evaluation.
          </p>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] gap-8 md:gap-12 items-start max-w-6xl mx-auto">
          {stacked}
          <div className="lg:sticky lg:top-24">{resultPanel}</div>
        </div>

        <div className="lg:hidden max-w-xl mx-auto">{stepper}</div>
      </div>

      <StickyEstimateBar
        mode="inline"
        visible={calculatorInView}
        result={result}
        summary={selectionSummary}
        ctaLabel={barCtaLabel}
        ctaDisabled={barCtaDisabled}
        onCta={barCtaAction}
      />
    </Section>
  );
}
