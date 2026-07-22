# Estimator calibration

## What is guaranteed, and what is not

There are two separate questions about the estimator, and they have very
different answers.

**1. Is the arithmetic correct?** Yes, and it is proven on every build.
`npm run verify:estimate` runs 5,300+ invariant checks across every project
type, finish level, size step, and scope ladder, asserting that:

- every reachable combination produces a finite, positive, correctly rounded range
- a larger space never costs less; a richer finish never costs less; escalating
  any scope option never lowers the estimate
- the range never collapses to a false single number, and never widens past 2.2x
- supplying more detail always tightens the band, never widens it
- remodel cost scales **sublinearly** with floor area, while new construction
  (additions, ADUs) scales close to linearly
- at its reference size with nothing else selected, every project and finish
  reproduces the 2025 Boise Remodeling Cost Guide exactly

This suite is wired into `prebuild`, so a change that breaks any invariant
fails the build before it can reach a homeowner. It is also verified to
actually catch regressions: restoring the old linear size scaling makes it fail
with `kitchen: price scaled 2.00x for 2.00x area (must be sublinear)`.

**2. Do the dollar amounts match real Boise costs?** They now come from a
stated source. `PRICE_MATRIX` encodes the **2025 Boise Remodeling Cost Guide**
(owner-supplied), which gives per-square-foot ranges against a reference size
per project type. Those reference sizes match the engine baselines exactly, so
each cell is the guide rate multiplied by that size, and a source-fidelity
check in the invariant suite fails the build if the estimator ever quotes
something other than the guide at the reference size.

Two things to know about that encoding:

- The guide's kitchen high-end cell is internally inconsistent: it lists
  $400-$650/sf but a total of $100,000-$137,500, and $137,500 implies $550/sf.
  The per-square-foot figure is used, because the guide's stated unit is per
  square foot and $650 sits flush against the $700 luxury floor. Change `high`
  on kitchen high-end to 137500 if the dollar figure was intended.
- A per-square-foot rate holds only at the reference size. Cost scales
  sublinearly from there, so larger projects carry a lower effective rate. This
  matches how remodel cost behaves and mirrors the guide's own rates falling as
  category size rises.

## The 20 percent planning adjustment

Quoted ranges are deliberately set **20 percent below** the published guide,
via `PLANNING_RANGE_ADJUSTMENT` in `shared/estimateEngine.ts`. This is an owner
decision, made to avoid opening the conversation with a number that reads as
sticker shock.

It is a single constant rather than 42 edited numbers, so `PRICE_MATRIX` stays
a faithful, auditable copy of the guide and the decision remains one visible,
reversible line. Set it to `1` to quote the guide as published. Scaling both
ends by the same factor leaves the range width ratio untouched, so the
uncertainty band and every monotonicity property are unaffected.

The invariant suite verifies this exact relationship, so the offset stays
intentional and any other drift still fails the build.

**The tradeoff this encodes.** The estimator now quotes below the company's own
cost guide, which means the difference surfaces at proposal time rather than in
the estimate. That is the failure mode of an estimate that is too low: a
homeowner can arrive expecting a number the work cannot be delivered for. If
proposals start landing consistently above the range, raising this constant is
the first lever to reach for, not the base rates.

**Site content is not adjusted by this constant.** Cost figures published in
guides, articles, and llms.txt are separate hand-written content and still
reflect older, higher numbers. They will read as inconsistent with the
estimator until reconciled.

This is a real source, but it is still a published guide rather than a
regression against closed jobs. The procedure below remains the way to confirm
it against what you actually bill.

## How to calibrate against real jobs

The only authoritative source is your own closed work. Public "cost guides"
(HomeAdvisor, Angi, and similar) are lead-generation content with wide,
national, and frequently inflated figures; calibrating to them would substitute
one unfounded number for another.

### Step 1: pull 8 to 12 closed jobs

Spread them across project types and finish levels. For each, record:

| Field | Notes |
|---|---|
| Project type | kitchen, bathroom, whole-home, addition, adu, basement |
| Finish level | which of refresh / mid-range / high-end / luxury it really was |
| Square footage | the actual area of the space worked on |
| Layout changes | none / moderate / major |
| Plumbing + electrical | cosmetic / partial / full |
| Cabinet tier | standard / semi-custom / custom (kitchens) |
| **Final contract value** | what the client actually paid, excluding change orders driven by client-added scope |

Exclude outliers you would not want to repeat, and note any job where an
unusual condition (major structural surprise, abatement) drove the number.

### Step 2: compare against the model

For each job, run the same inputs through the estimator and record what it
predicts. If the model is systematically high or low by a similar percentage
across a project type, the base rate for that type is the thing to move.

### Step 3: adjust the base, not the multipliers

`PRICE_MATRIX` values are the range for a project at its **baseline size** with
**no refinements applied**. Baselines are in `PROJECT_SIZE_CONFIG`:

| Project | Baseline |
|---|---|
| kitchen | 250 sq ft |
| bathroom | 80 sq ft |
| whole-home | 1,800 sq ft |
| addition | 400 sq ft |
| adu | 600 sq ft |
| basement | 900 sq ft |

So the kitchen `mid-range` entry answers exactly one question: *what does a
250 sq ft mid-range kitchen remodel cost, before any layout, systems, or
cabinetry choices are applied?* Set that number, and the size elasticity and
scope multipliers extend it to every other configuration.

Resist adjusting the multipliers to force one job to match. The multipliers
encode structural relationships (how much a wall removal or a cabinet tier
moves cost); the base encodes your market. Fixing a market error in the
multipliers will distort every other configuration.

### Step 4: re-verify

```bash
npm run verify:estimate
```

The invariant suite will catch any change that breaks monotonicity, band
sanity, or the scaling rules. It will **not** tell you the new numbers are
right, only that they are internally consistent.

## Current base rates

What a homeowner sees at the reference size with nothing else selected, after
the 20 percent planning adjustment. The guide figure is in parentheses.

| Project | refresh | mid-range | high-end | luxury |
|---|---|---|---|---|
| kitchen (250 sf) | $15-25k *(19-31)* | $35-55k *(44-69)* | $80-130k *(100-163)* | $140-180k *(175-225)* |
| bathroom (80 sf) | $10-16k *(12-20)* | $18-29k *(22-36)* | $35-51k *(44-64)* | $58-90k *(72-112)* |
| whole-home (1,800 sf) | $43-72k *(54-90)* | $108-180k *(135-225)* | $216-310k *(270-387)* | $360-612k *(450-765)* |
| addition (400 sf) | n/a | $96-136k *(120-170)* | $160-224k *(200-280)* | $272-368k *(340-460)* |
| adu (600 sf) | n/a | $168-240k *(210-300)* | $240-336k *(300-420)* | $336-480k *(420-600)* |
| basement (900 sf) | n/a | $36-61k *(45-77)* | $72-115k *(90-144)* | $126-180k *(158-225)* |

## Size elasticity

`SIZE_ELASTICITY` controls how strongly cost tracks floor area. 1.0 is linear.

| Project | Elasticity | Reasoning |
|---|---|---|
| kitchen | 0.55 | cost follows cabinet runs and appliance count, not floor area |
| bathroom | 0.6 | fixture count and tile area dominate |
| basement | 0.75 | large open areas are cheap per sq ft once systems are in |
| whole-home | 0.85 | more area genuinely means more rooms to touch |
| adu | 0.9 | new construction, but fixed kitchen and bath cores dilute it |
| addition | 0.95 | new square footage: close to linear |

These are reasoned from how remodel cost is actually incurred, not measured
from job data. If your own jobs show a different relationship between size and
cost, these are the numbers to revise.
