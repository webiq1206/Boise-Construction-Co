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
- the specific configuration that produced the reported $198k-$247k kitchen
  stays well below that figure

This suite is wired into `prebuild`, so a change that breaks any invariant
fails the build before it can reach a homeowner. It is also verified to
actually catch regressions: restoring the old linear size scaling makes it fail
with `kitchen: price scaled 2.00x for 2.00x area (must be sublinear)`.

**2. Do the dollar amounts match real Boise costs?** This cannot be proven from
inside the repository, and it is not currently grounded in anything.

The base rates live in `PRICE_MATRIX` in `shared/estimateEngine.ts`. Searching
the repository turns up **no source, citation, survey, or calibration note for
any of those numbers**, and they were introduced in a UI redesign commit rather
than derived from job costs. Every other module in this codebase documents its
provenance carefully; these numbers do not, because there is nothing to cite.

No amount of math correctness fixes that. A perfectly-calculated estimate built
on an unfounded base rate is still wrong. The structural fixes removed two real
defects that were inflating results, but the anchor itself still needs to come
from you.

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

## Current base rates, for reference

These are what a homeowner sees at baseline size with nothing else selected.
Every one of these is an unvalidated assumption until checked against real jobs.

| Project | refresh | mid-range | high-end | luxury |
|---|---|---|---|---|
| kitchen (250 sf) | $18-32k | $40-70k | $82-143k | $164-287k |
| bathroom (80 sf) | $11-19k | $21-37k | $44-76k | $87-153k |
| whole-home (1,800 sf) | $47-83k | $101-179k | $207-358k | $407-693k |
| addition (400 sf) | n/a | $108-182k | $205-345k | $378-542k |
| adu (600 sf) | n/a | $192-253k | $268-342k | $368-532k |
| basement (900 sf) | n/a | $40-70k | $81-134k | $151-249k |

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
