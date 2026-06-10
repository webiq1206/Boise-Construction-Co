import {
  EMPTY_ESTIMATE_INPUT,
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getProjectSizeConfig,
  getRefinementVisibility,
  getSetRefinementKeys,
  getSizePresets,
  isCompleteEstimateInput,
  type ProjectType,
  type UserRefinementKey,
} from "../shared/estimateEngine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const projects: ProjectType[] = ["kitchen", "bathroom", "whole-home", "addition", "adu"];

// Nothing is selected by default and no estimate can exist without selections.
assert(EMPTY_ESTIMATE_INPUT.project === null, "no project selected by default");
assert(EMPTY_ESTIMATE_INPUT.finish === null, "no finish selected by default");
assert(EMPTY_ESTIMATE_INPUT.sqft === null, "no size selected by default");
assert(
  Object.values(EMPTY_REFINEMENTS).every((v) => v === null),
  "no refinement selected by default",
);
assert(!isCompleteEstimateInput(EMPTY_ESTIMATE_INPUT), "empty input is not calculable");
assert(getSetRefinementKeys(EMPTY_REFINEMENTS).length === 0, "no refinement keys set by default");

for (const project of projects) {
  const visibility = getRefinementVisibility(project);
  const maxFields = getMaxRefinementFields(project);
  const visibleCount = Object.values(visibility).filter(Boolean).length;
  assert(maxFields === visibleCount, `${project} max fields matches visibility (${maxFields})`);

  if (project === "addition" || project === "adu") {
    assert(!visibility.layoutChanges, `${project} hides layout changes`);
    assert(maxFields === 2, `${project} exposes two refinement fields`);
  } else {
    assert(visibility.layoutChanges, `${project} shows layout changes`);
    assert(maxFields === 3, `${project} exposes three refinement fields`);
  }

  // Size presets are valid, intentional starting points within bounds.
  const config = getProjectSizeConfig(project);
  const presets = getSizePresets(project);
  assert(presets.length === 3, `${project} has three size presets`);
  for (const preset of presets) {
    assert(
      preset.sqft >= config.min && preset.sqft <= config.max,
      `${project} preset ${preset.id} within bounds`,
    );
    assert(preset.sqft % config.step === 0, `${project} preset ${preset.id} snaps to step`);
  }
}

const kitchenMax = getMaxRefinementFields("kitchen");
const kitchenDetailed = calculateEstimate(
  {
    project: "kitchen",
    finish: "mid-range",
    sqft: getProjectSizeConfig("kitchen").baselineSqft,
    refinements: {
      ...EMPTY_REFINEMENTS,
      layoutChanges: "major",
      plumbingElectrical: "full",
      cabinetTier: "custom",
    },
  },
  kitchenMax,
);
assert(kitchenDetailed.confidence === "detailed", "kitchen reaches detailed guidance at max fields");
assert(kitchenDetailed.confidencePercent === 85, "kitchen detailed guidance is 85%");

// Unset refinements never move the price (null acts as a 1.0x multiplier).
const kitchenBase = calculateEstimate(
  {
    project: "kitchen",
    finish: "mid-range",
    sqft: getProjectSizeConfig("kitchen").baselineSqft,
    refinements: { ...EMPTY_REFINEMENTS },
  },
  0,
);
const kitchenNeutral = calculateEstimate(
  {
    project: "kitchen",
    finish: "mid-range",
    sqft: getProjectSizeConfig("kitchen").baselineSqft,
    refinements: { ...EMPTY_REFINEMENTS, layoutChanges: "none", plumbingElectrical: "cosmetic" },
  },
  2,
);
assert(
  kitchenBase.priceLow === kitchenNeutral.priceLow && kitchenBase.priceHigh === kitchenNeutral.priceHigh,
  "neutral refinements match unset refinements in price",
);

// ADU configuration: detached carries a premium over attached; neither uses
// the two-story addition multiplier.
const aduInput = {
  project: "adu" as const,
  finish: "mid-range" as const,
  sqft: getProjectSizeConfig("adu").baselineSqft,
};
const aduDetached = calculateEstimate(
  { ...aduInput, refinements: { ...EMPTY_REFINEMENTS, aduConfig: "detached" } },
  1,
);
const aduAttached = calculateEstimate(
  { ...aduInput, refinements: { ...EMPTY_REFINEMENTS, aduConfig: "attached" } },
  1,
);
assert(aduDetached.priceHigh > aduAttached.priceHigh, "detached ADU prices above attached");
assert(
  aduDetached.included.includes("Detached ADU") && aduAttached.included.includes("Attached ADU"),
  "ADU configuration reflected in scope",
);

const aduDetailed = calculateEstimate(
  {
    ...aduInput,
    refinements: { ...EMPTY_REFINEMENTS, plumbingElectrical: "full", aduConfig: "attached" },
  },
  2,
);
assert(aduDetailed.confidence === "detailed", "ADU reaches detailed guidance at max fields");

const hiddenKeys: UserRefinementKey[] = ["layoutChanges", "plumbingElectrical"];
const hiddenCount = countVisibleUserRefinements("adu", hiddenKeys);
assert(hiddenCount === 1, "hidden layout refinements are not counted for ADU");
assert(
  countVisibleUserRefinements("adu", ["aduConfig", "stories"]) === 1,
  "stories not counted for ADU; aduConfig counted",
);

// Sub-baseline counts never discount below the base range.
const bathBase = calculateEstimate(
  {
    project: "bathroom",
    finish: "mid-range",
    sqft: getProjectSizeConfig("bathroom").baselineSqft,
    refinements: { ...EMPTY_REFINEMENTS },
  },
  0,
);
const bathOneFixture = calculateEstimate(
  {
    project: "bathroom",
    finish: "mid-range",
    sqft: getProjectSizeConfig("bathroom").baselineSqft,
    refinements: { ...EMPTY_REFINEMENTS, fixtureCount: 1 },
  },
  1,
);
assert(
  bathOneFixture.priceLow >= bathBase.priceLow && bathOneFixture.priceHigh >= bathBase.priceHigh,
  "low fixture count never discounts the range",
);

const wholeHomeLarge = calculateEstimate(
  {
    project: "whole-home",
    finish: "mid-range",
    sqft: 8000,
    refinements: { ...EMPTY_REFINEMENTS },
  },
  0,
);
const wholeHomeBase = calculateEstimate(
  {
    project: "whole-home",
    finish: "mid-range",
    sqft: getProjectSizeConfig("whole-home").baselineSqft,
    refinements: { ...EMPTY_REFINEMENTS },
  },
  0,
);
assert(
  wholeHomeLarge.priceHigh > wholeHomeBase.priceHigh,
  "whole-home price scales up with square footage",
);

const aduMaxSqft = getProjectSizeConfig("adu").max;
assert(aduMaxSqft === 900, "ADU square footage is capped at 900");

console.log("All estimate engine checks passed.");
