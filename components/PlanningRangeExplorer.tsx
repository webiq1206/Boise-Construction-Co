"use client";

import { useMemo, useState } from "react";
import { familyButtonClass } from "@/components/family/Button";
import { SelectableCard } from "@/components/estimate/wizard/SelectableCard";
import {
  EMPTY_REFINEMENTS,
  NEW_CONSTRUCTION_PROJECT_TYPES,
  PROJECT_LABELS,
  PROJECT_SIZE_CONFIG,
  calculateEstimate,
  formatPlanningCurrency,
  type NewConstructionProjectType,
} from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { toSentenceCase } from "@/shared/sentenceCase";
import styles from "@/components/approved/HomePlanningSections.module.css";

/**
 * Homepage interactive proof (C14): pick a project type, set finished living
 * area, see a planning floor immediately. No email gate.
 *
 * What actually runs: the simple matrix estimator, `calculateEstimate` in
 * shared/estimateEngine.ts, called with the chosen project type, the clamped
 * square footage, finish fixed at "mid-range" (Signature) and
 * EMPTY_REFINEMENTS. That is the per-project low/high matrix scaled by size,
 * with the starting band only (no visitor detail to tighten it). It does NOT
 * run the detailed line-item takeoff in shared/costs/newConstructionRules.ts,
 * and it has no lot, site, utility, design or permit input, so the figure is a
 * planning range, not a lot-specific or all-in number.
 */
const PROOF_PROJECTS = NEW_CONSTRUCTION_PROJECT_TYPES;

const PLANNING_DISCLAIMER =
  "2026 planning floor only, land not included. Site work, impact fees and utility connections are estimated separately. Treasure Valley mid-range (Signature) finish. Not a bid. Request a quote for next steps.";

export function PlanningRangeExplorer() {
  // The first project type is selected on arrival, so the panel opens on a worked
  // example (a 2,400 sqft custom home) instead of an empty box; one click changes it.
  const [project, setProject] = useState<NewConstructionProjectType | null>(PROOF_PROJECTS[0]);
  const [sqft, setSqft] = useState(PROJECT_SIZE_CONFIG[PROOF_PROJECTS[0]].baselineSqft);

  const size = project ? PROJECT_SIZE_CONFIG[project] : null;

  const estimate = useMemo(() => {
    if (!project || !size) return null;
    const clamped = Math.min(size.max, Math.max(size.min, sqft));
    return calculateEstimate({
      project,
      finish: "mid-range",
      sqft: clamped,
      refinements: { ...EMPTY_REFINEMENTS },
    });
  }, [project, sqft, size]);

  function selectProject(next: NewConstructionProjectType) {
    setProject(next);
    setSqft(PROJECT_SIZE_CONFIG[next].baselineSqft);
  }

  return (
    <section
      className={`approved-estimate fr-band ${styles.planningSection}`}
      aria-labelledby="planning-ranges-title"
      id="calculator"
      data-testid="planning-range-explorer"
      data-family-bar-yield
    >
      <div className="approved-estimate-intro">
        <div>
          <p className="f-eyebrow">PLANNING RANGES</p>
          <h2 id="planning-ranges-title">
            Start with a planning number.
            {" "}Then request a quote.
          </h2>
        </div>
        <div>
          <p>
            Choose a project type and finished living area. You get a planning
            floor right away, no email required. Request a quote and we answer
            your questions and help you work out the next step.
          </p>
        </div>
      </div>

      <div className="planning-range-grid">
        <div className="planning-range-controls">
          <p className="planning-range-label">1. What are you building?</p>
          <div
            role="radiogroup"
            aria-label="Project type"
            className="planning-range-cards"
          >
            {PROOF_PROJECTS.map((id) => (
              <SelectableCard
                key={id}
                dense
                control="radio"
                selected={project === id}
                onSelect={() => selectProject(id)}
                title={toSentenceCase(PROJECT_LABELS[id].label)}
                description={PROJECT_LABELS[id].sub}
                data-testid={`proof-project-${id}`}
              />
            ))}
          </div>

          {project && size && (
            <div className="planning-range-slider-wrap">
              <label className="planning-range-label" htmlFor="planning-sqft">
                2. Finished living area
              </label>
              <div className="planning-range-sqft-row">
                <span data-testid="proof-sqft-value">
                  <DisplayNum>{sqft.toLocaleString()}</DisplayNum> sqft
                </span>
              </div>
              <input
                id="planning-sqft"
                type="range"
                min={size.min}
                max={size.max}
                step={size.step}
                value={Math.min(size.max, Math.max(size.min, sqft))}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="planning-range-slider"
                data-testid="proof-sqft-slider"
                aria-valuemin={size.min}
                aria-valuemax={size.max}
                aria-valuenow={sqft}
                aria-label="Finished living area in square feet"
              />
              <div className="planning-range-sqft-bounds">
                <span>
                  <DisplayNum>{size.min.toLocaleString()}</DisplayNum>
                </span>
                <span>
                  <DisplayNum>{size.max.toLocaleString()}</DisplayNum>
                </span>
              </div>
            </div>
          )}
        </div>

        <aside
          className="planning-range-result fr-range-result"
          aria-live="polite"
          data-testid="proof-result"
        >
          <p className="fr-range-result-label">Your planning floor</p>
          {estimate ? (
            <>
              <p className="planning-range-value fr-range-result-figure" data-testid="proof-range-value">
                From{" "}
                <DisplayNum>{formatPlanningCurrency(estimate.priceLow)}</DisplayNum>
              </p>
              <p className="planning-range-band">
                Typical band{" "}
                <DisplayNum>{formatPlanningCurrency(estimate.priceLow)}</DisplayNum>
                {" to "}
                <DisplayNum>{formatPlanningCurrency(estimate.priceHigh)}</DisplayNum>
                {" · land not included"}
              </p>
              <p className="planning-range-note">{PLANNING_DISCLAIMER}</p>
              <a
                className={familyButtonClass({ variant: "primary", size: "lg" })}
                href="/estimate"
                data-testid="proof-cta-estimate"
              >
                Request a quote
              </a>
            </>
          ) : (
            <p className="planning-range-empty">
              Choose a project type and living area to see a planning floor. No
              email required.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
