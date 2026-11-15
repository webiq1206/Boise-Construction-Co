"use client";

import { useEffect, useState } from "react";
import { familyButtonClass } from "@/components/family/Button";
import { SelectableCard } from "@/components/estimate/wizard/SelectableCard";
import { PROJECT_LABELS, formatPlanningCurrency } from "@/shared/estimateLabels";
import {PLANNING_PROJECTS, publicPlanningRange, type PlanningProject, type PublicPlanningRange} from "@/shared/publicPlanningRange";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { toSentenceCase } from "@/shared/sentenceCase";
import styles from "@/components/approved/HomePlanningSections.module.css";

/**
 * Homepage interactive proof (C14): pick a project type, set finished living
 * area, see a planning floor immediately. No email gate.
 *
 * Only public controls and selling ranges reach this client. The pure planning
 * endpoint applies the existing shared engine on the server; the cost book
 * and finance policy remain outside the browser graph.
 */
const PROOF_PROJECTS: PlanningProject[] = ["custom-home", "semi-custom-home", "build-on-your-lot", "shop-home"];

const PLANNING_DISCLAIMER =
  "2026 planning floor only, land not included. Site work, impact fees and utility connections are estimated separately. Treasure Valley mid-range (Signature) finish. Not a bid. Request a quote for next steps.";

export function PlanningRangeExplorer() {
  // The first project type is selected on arrival, so the panel opens on a worked
  // example (a 2,400 sqft custom home) instead of an empty box; one click changes it.
  const [project, setProject] = useState<PlanningProject>(PROOF_PROJECTS[0]);
  const [sqft, setSqft] = useState(2400);
  const [result, setResult] = useState<{key: string; range: PublicPlanningRange} | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const size = PLANNING_PROJECTS[project];
  const area = Math.min(size.max, Math.max(size.min, sqft));
  const inputKey = `${project}|${area}`;
  const estimate = result?.key === inputKey ? result.range : null;
  const failed = failedKey === inputKey;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      deadline = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch("/api/planning-range", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({project, sqft: area}), signal: controller.signal,
        });
        const range = publicPlanningRange(await response.json());
        if (!response.ok || !range) throw new Error("Planning range unavailable");
        if (active) {setResult({key: inputKey, range}); setFailedKey(null);}
      } catch {
        if (active) {setResult(null); setFailedKey(inputKey);}
      } finally {clearTimeout(deadline);}
    }, 150);
    return () => {active = false; clearTimeout(timer); clearTimeout(deadline); controller.abort();};
  }, [project, area, inputKey, retry]);

  function selectProject(next: PlanningProject) {
    setFailedKey(null);
    setProject(next);
    setSqft(PLANNING_PROJECTS[next].baselineSqft);
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
          aria-busy={!estimate && !failed}
          data-planning-state={failed ? "error" : estimate ? "ready" : "loading"}
          data-planning-input={inputKey}
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
            <div className="planning-range-empty">
              <p role={failed ? "alert" : "status"}>{failed ? "We could not update your planning range. Please try again." : "Updating your planning range…"}</p>
              {failed && <button type="button" className={familyButtonClass({variant: "primary", size: "lg"})} onClick={() => {setFailedKey(null); setRetry(value => value + 1);}}>Try again</button>}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
