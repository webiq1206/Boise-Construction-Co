# Estimator calibration

> **Read this first (2026-08).** Much of this document calibrates the six
> remodel categories (kitchen, bathroom, whole-home, addition, ADU, basement).
> Those are **not offered on the public estimator** - the live calculator sells
> custom-home, semi-custom-home, shop-home, and build-on-your-lot, priced by
> the line-item takeoff engine in `shared/costs/`. The remodel `PRICE_MATRIX`
> remains load-bearing in three narrower places: RE-10 repair pricing, the
> market-price ceiling that trims new-construction margins, and the invariant
> suite. Calibrate against real closed jobs exactly as described below, but
> know which surface you are moving before you move it.

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

## Calibrated categories (real jobs beat the guide)

**ADU, calibrated 2026-07.** This is the first category whose rates come from a
closed job rather than the published guide, and it is the model for how the
rest should eventually be set.

The guide put a mid-range detached ADU at $210,000 to $300,000 against the
600 sq ft reference, which is $350/sq ft at the floor. The cheapest detached
ADU actually delivered came in around **$145,000**, and the owner set the
starting point at **$250/sq ft**. Every ADU tier was scaled by the same
**0.7364** so the tier relationships the guide gets right are preserved while
the entry point matches what the work actually costs.

| | Guide (was) | Calibrated (now) |
|---|---|---|
| mid-range | $210,000 - $300,000 | $155,000 - $221,000 |
| high-end | $300,000 - $420,000 | $221,000 - $309,000 |
| luxury | $420,000 - $600,000 | $309,000 - $442,000 |

A 600 sq ft mid-range detached ADU now quotes $149,000 to $182,000, or
$248/sq ft at the floor. The real $145,000 job sits just below that low end,
which is where a cheapest-ever job belongs.

The source-fidelity check in the invariant suite was updated to match, so ADU
is now asserted against the calibrated numbers rather than the guide. The
guide values are recorded in a comment there and in `PRICE_MATRIX` so the
departure stays visible and reversible.

**Kitchen, calibrated 2026-07.** Every tier scaled by **0.85** from the guide.

Two issued estimates: EST-10088 billed $34,335 (pre-discount) and EST-10049's
kitchen billed $31,850. Neither is directly comparable, because both carry a
narrower scope than this catalog's kitchen: EST-10088 has no flooring and no
backsplash, EST-10049 has no flooring, demolition, drywall or paint in the
kitchen line. Normalizing each to the full component scope in `costCatalog.ts`
(by the share of direct work it actually covers, and removing the
client-supplied appliances EST-10049 lists) puts a full-scope, mid-range
equivalent at about **$35,250** and **$46,330**, against a model quoting
**$49,500**. That is 0.71x and 0.94x.

| | Guide (was) | Calibrated (now) |
|---|---|---|
| refresh | $18,750 - $31,250 | $15,900 - $26,600 |
| mid-range | $43,750 - $68,750 | $37,200 - $58,400 |
| high-end | $100,000 - $162,500 | $85,000 - $138,100 |
| luxury | $175,000 - $225,000 | $148,800 - $191,300 |

A 250 sq ft L-shape mid-range kitchen now quotes **$38,000 to $46,000**, down
from about $44,000 to $55,000.

**The two data points disagree, so 0.85 is deliberately the conservative middle
rather than the lower reading.** Cutting to 0.71 would match EST-10088 but would
under-quote a genuinely full-scope kitchen, and the floor is the number a
homeowner holds you to. This is the weakest of the three calibrated categories:
one more closed kitchen **with its square footage recorded** settles it properly.

**Whole-home, owner pricing decision 2026-07.** All tiers scaled by **4/3**.

This one is a judgement call, not a regression, and is labelled as such. The
range test found **no systematic bias to correct** - the two reference jobs
erred in opposite directions - but the only one that was a real renovation (the
VA Proposal) had the engine quoting **low** at 0.84x. The owner's position was
that mid-range was too low, and the size of the correction is their market
knowledge rather than anything in the data.

The factor is set by the mid-range target: a $100/sq ft floor at the 1,800 sq ft
reference. All four tiers moved together, so the ladder is unchanged.

| | Guide (was) | Now |
|---|---|---|
| refresh | $54,000 - $90,000 | $72,000 - $120,000 |
| mid-range | $135,000 - $225,000 | $180,000 - $300,000 |
| high-end | $270,000 - $387,000 | $360,000 - $516,000 |
| luxury | $450,000 - $765,000 | $600,000 - $1,020,000 |

An 1,800 sq ft mid-range whole-home now quotes **$180,000 to $240,000**
($100/sq ft floor), up from $135,000 to $180,000 ($75/sq ft). The VA Proposal
moves from outside the range to **inside** it at 1,000-1,200 sq ft.

Set the factor back to 1 to restore the guide.

**Two consequences worth watching.**

1. **The elasticity question at the top of the size curve is now sharper.**
   Whole-home luxury at 8,000 sq ft quotes **$2.13M to $2.90M**. The 0.85
   elasticity was already flagged as probably generous over that 4.4x span, and
   a 4/3 uplift multiplies whatever error is there. If large-home quotes start
   looking wrong, the elasticity is the lever, not the base rate.
2. **`WHOLE_HOME_ASSUMED_BATHS` is now stale.** It was solved by subtracting a
   kitchen and N baths from the whole-home figure and checking the residual was
   believable, which accepted $37/sq ft at two baths and rejected $51 as
   impossible. With whole-home up 4/3 and kitchen down to 0.85, that same
   arithmetic now leaves **$75/sq ft** at two baths. It is deliberately left at
   2: re-solving would push it to about 4, and since it is the figure the
   stated-bathroom-count adjustment measures FROM, raising it would quietly
   discount every home with fewer than four baths and cancel out the increase.
   The residual test is simply too crude now - it treats everything that is not
   a kitchen or bath as "flooring, paint and trim" when the scope also carries
   HVAC, windows, electrical and plumbing. One closed whole-home job with square
   footage and bathroom count settles it.

**Room addition, derived 2026-07.** Not measured, but no longer the guide.

The guide's addition numbers were internally contradictory: at every matched
size they made a room addition cost MORE per square foot than an ADU ($282 to
$345 against $248 to $303 at 600 sq ft). That is backwards. An ADU carries a
full kitchen, a full bathroom and its own utility connections, which the
component catalog puts at 18 percent of its cost and which a bedroom or family
room addition does not have. The ADU figure had been corrected against a real
job; the addition figure had not, so the two drifted into contradiction.

Derivation: strip those three components (18 percent) from the calibrated ADU,
then add back 10 percent for tying into an existing structure, which an ADU on
a clean pad never pays: demolishing the exterior wall, the structural header,
and matching roofline and finishes. Net 0.902 of an equivalent size ADU, which
puts every tier at 0.8116 of the guide.

| | Guide (was) | Derived (now) |
|---|---|---|
| mid-range | $120,000 - $170,000 | $97,000 - $138,000 |
| high-end | $200,000 - $280,000 | $162,000 - $227,000 |
| luxury | $340,000 - $460,000 | $276,000 - $373,000 |

**This is the weakest link in the model.** It rests on the ADU calibration plus
the component shares, both of which are one step removed from a real addition.
One closed job (contract value and square footage) replaces the whole
derivation, exactly as the $145,000 ADU replaced the guide.

## Whole-home bathroom reference scales with size (fixed 2026-07)

`ASSUMED_BATHROOMS["whole-home"]` is not a default applied to a lead. The
estimator asks for the real count; this number is the bath content already
baked into the published rate, and it is only what the adjustment measures
FROM. It was solved at the 1,800 sq ft reference and then held flat while the
rate was scaled across an 800 to 8,000 sq ft slider, so it measured from the
wrong place at every size except the baseline.

Re-solved the same way: subtract a kitchen and N baths from the whole-home
figure and read the residual left for general living space, which should stay
roughly constant across sizes because flooring, paint and trim do not get
cheaper per foot as a house grows. At mid-range the reference leaves $39/sq ft
with 2 baths, and that residual is reproduced by one bath per 1,000 sq ft:

| home size | baths the rate covers |
|---|---|
| 1,800 sq ft | 2 (unchanged, so source fidelity holds) |
| 3,000 sq ft | 3 |
| 5,000 sq ft | 5 |
| 8,000 sq ft | 8 |

The practical effect is a price **reduction** on large homes, not an increase.
An 8,000 sq ft mid-range whole-home with 5 stated bathrooms was quoting
$539,000 to $719,000; it now quotes $420,000 to $560,000, because the rate
already covers eight and the homeowner has five. Previously those three extra
baths were charged twice.

**Open question this raises.** Eight bathrooms in an 8,000 sq ft house is a
lot. That the arithmetic demands it suggests the top of the size curve is
generous, i.e. the 0.85 whole-home elasticity extrapolates too high over a
4.4x span. That is a question about elasticity, not about this constant, and it
should be settled against a real large-home job rather than by adjusting one
number to make the other look right.

## The size multiplier plateau (fixed 2026-07)

`getSizeMultiplier` clamped its result to [0.6, 2] as a runaway guard. Because
sqft is already bounded by each project's own slider and re-validated server
side, that clamp was redundant, and it bound well inside the legitimate range
rather than at the extremes:

- whole-home at 8,000 sq ft was understated by 78 percent, quoted as though it
  were about 4,000 sq ft
- addition at 1,200 sq ft was understated by 42 percent
- small whole-home, addition, ADU and basement projects were overstated by 10
  to 20 percent

Worse, it produced plateaus: every whole-home between 4,070 and 8,000 sq ft
returned an identical price, as did every addition above about 830 sq ft. The
monotonicity invariant never caught it because "a larger space never costs
less" permits equal.

The fix bounds the input (sqft clamped to the project's configured range)
instead of the output, letting the elasticity curve run across the whole span.
A new invariant fails the build if price is flat across more than a tenth of
any project's size slider, and it is mutation tested: restoring the clamp fails
with "whole-home/refresh: price is flat across 39 consecutive size steps".

## The planning adjustment (ceiling only)

Quoted ranges sit below the published guide via
`PLANNING_RANGE_ADJUSTMENT_LOW` and `PLANNING_RANGE_ADJUSTMENT_HIGH` in
`shared/estimateEngine.ts`. This is an owner decision, made to avoid opening the
conversation with a number that reads as sticker shock.

The reduction is **asymmetric**: the ceiling comes down 20 percent, the floor
stays at the guide. Sticker shock is caused by the top of a range, so cutting
the floor by the same amount softens nothing and actively harms, because it
advertises an entry price the work cannot be delivered for. A uniform cut had
pulled the whole-home floor from $75/sq ft to $60/sq ft, which reads as a light
cosmetic refresh rather than the "replace and upgrade" scope it describes.

Two constants rather than 42 edited numbers, so `PRICE_MATRIX` stays a
faithful, auditable copy of the guide and the decision remains visible and
reversible. Set both to `1` to quote the guide as published.

Because only the ceiling moves, the range narrows. Where a category's published
spread is already narrow, that pushes the band under `MIN_BAND` and the model
widens it back symmetrically around the centre rather than quote a falsely
precise range, so the floor can land a little under the guide. The invariant
suite allows for that, and separately asserts no ceiling ever exceeds what the
guide publishes.

**The tradeoff this encodes.** The ceiling sits below the company's own cost
guide, so a project landing at the top of the published range will exceed what
the estimator showed. Keeping the floor honest is what stops that gap becoming
a promise nobody can keep. If proposals consistently land above the range,
`PLANNING_RANGE_ADJUSTMENT_HIGH` is the first lever to reach for, not the base
rates.

**Site content is not adjusted by this constant.** Cost figures published in
guides, articles, and llms.txt are separate hand-written content and still
reflect older, higher numbers. They will read as inconsistent with the
estimator until reconciled.

This is a real source, but it is still a published guide rather than a
regression against closed jobs. The procedure below remains the way to confirm
it against what you actually bill.

## Reference estimates on file (2026-07)

Seven owner-supplied estimates were measured against the live engine. They are
recorded here because they are the closest thing to Step 1 below that exists so
far, and because two of them are needed to justify the unit rates in
`costCatalog.ts` if those are ever converted from derived to measured.

| Estimate | Total | Modeled as | Engine midpoint | Ratio |
|---|---|---|---|---|
| Kitchen EST-10088 | $34,335 (pre-discount) | kitchen / mid-range @250sf | $49,500 | **1.44x high** |
| Basement finish EST-10089 | $62,108 | basement / mid-range @900sf | $62,000 | **1.00x** |
| Garage conversion EST-10080 | $24,695 | basement / mid-range @440sf | $33,500 | **1.36x high** |
| VA Proposal EST-10079 | $133,808 | whole-home / mid-range @1200sf | $134,500 | **1.01x** |
| Basement + main repairs EST-10049 | $92,938 | whole-home / mid-range @1500sf | $112,000 | 1.21x high |
| Walden Addition EST-10010 | $187,470 | mixed addition + 2 baths + flooring | not directly comparable | - |
| Cabinet proposal EST-10098 | $7,468 cabinets | not a whole project | - | - |

**Caveats that still apply to these figures.**

1. **Market — resolved.** Six of the seven are Pueblo / Pueblo West,
   **Colorado**, not Boise, Idaho. The owner confirmed (2026-07) that both
   markets are priced the same, so these are treated as valid reference jobs.
   If that ever stops being true, kitchen is the category to revisit first.
2. **No square footage.** Step 3 below sets rates at a **baseline size**, and
   none of these documents state the area worked on. Every ratio above assumes
   a size. This is the largest remaining source of error and the cheapest one
   to remove: recording sqft on the next few closed jobs settles it.
3. **Scope is not like-for-like.** The kitchen carried no flooring line and
   client-supplied appliances; the basement had client-supplied tile, pan,
   surround, toilet and vanities; EST-10049 is a water-damage repair. Each of
   those makes the real number lower than a full remodel at the same size, so
   the ratios above are read after normalizing for it (see kitchen, below).

**What the numbers say.** Basement (1.00x) and whole-home (1.01x) land
essentially on the money and were left alone. Addition and ADU gained no new
evidence. **Kitchen was the only outlier**, and the gap sat in the base rate
rather than the multipliers: with no refinements at all, kitchen mid-range at
its 250 sq ft baseline quoted $49,500 against a $34,335 job, and the
multipliers then stacked on top (custom cabinets + moderate layout + partial
plumbing/electrical reached $69,000, or 2.01x). Per Step 3, the base is what
moved. See the kitchen entry under calibrated categories.

The garage conversion (EST-10080, $24,695) has no matching project type and was
modeled as a basement, where it reads 1.36x high. That is a **missing category**
rather than a basement error - a garage conversion has an existing slab, walls
and roof, so it should not price like finishing a basement. Worth adding as its
own type if garage conversions become a real share of the work.

### Measured unit rates from EST-10010 (Walden Addition)

The only reference document with a full unit-rate takeoff. These are the rates
to reach for if `ComponentDef.unitCost` is ever converted from derived to
measured, subject to the same Colorado-market caveat.

| Trade | Rate |
|---|---|
| Site prep / grading labor | $80.30 /hr |
| Concrete labor | $84.70 /hr |
| Framing labor | $77.00 /hr |
| Roofing labor | $69.30 /hr |
| Insulation labor | $71.50 /hr |
| Stucco labor | $77.00 /hr |
| Excavation (crawl space) | $13.20 /cy |
| Haul away soil | $16.50 /cy |
| Foundation concrete | $166.75 /cy |
| Formwork | $8.50 /sf |
| Rebar | $1.44 /lf |
| OSB sheathing 7/16 4x8 | $18.37 /ea |
| 3/4" plywood subfloor | $52.64 /ea |
| Architectural shingles | $143.75 /sq |
| R-19 wall batts | $1.44 /sf |
| R-38 ceiling batts | $2.01 /sf |
| Stucco mix / color coat | $2.88 / $2.01 /sf |
| Drywall (hung + finished) | $125-$144 /sheet-equivalent |
| Baseboard / casing trim | $2.88 /lf |
| Interior paint | $3.30 /sf, prime $1.44 /sf |
| Carpet installed | $4.60 /sf |
| LVP material / install | $4.02 / $3.30 /sf |
| Floor tile allowance | $6.90 /sf |
| Shower wall tile | $9.20 /sf |
| Tile install (floor + surround) | $4,025-$5,175 /bath |
| Rough plumbing | $4,000-$5,000 /bath |
| Shower glass with door | $3,450 /ea |
| Hollow-core prehung door | $181.70 /ea + $220 install |
| Mini split installed | $5,000-$15,400 |

Cross-checks from the other documents: cabinets ran **$16,678** for a full
kitchen (EST-10088) and **$12,500** installed (EST-10049); a small cabinet
system with shelving and a bench ran **$7,468** (EST-10098). Granite counters
**$8,571** for a kitchen; kitchen counters with waterfall island **$9,350**.

## Range accuracy test: bathroom, kitchen, whole-home (2026-07)

Each reference job was normalized to the share of this catalog's direct scope it
actually covers, then the question asked was **which tier and size reproduces
it** rather than scoring against an asserted tier. That matters: scoring against
an asserted tier mostly measures the tier guess. A first pass judged the Walden
primary bath "high-end" and produced a false 2.10x alarm; read against its own
scope (drop-in non-jetted tub, 5x3 pan insert, no radiant heat) it is plainly
mid-range, where it lands at 1.08x.

| Job | Tier | Full-scope equiv | Engine at judged tier | Result |
|---|---|---|---|---|
| Walden primary bath | mid-range | $28,591 | $27,000 - $35,000 | **1.08x, inside** |
| Kitchen EST-10088 | mid-range | $40,213 | $37,000 - $47,000 | **1.04x, inside** |
| Kitchen EST-10049 | mid-range | $46,334 | $37,000 - $47,000 | **0.91x, inside** |
| VA Proposal | mid-range | $133,808 | $96,000 - $128,000 | 0.84x, engine low |
| Basement+main repairs | mid-range | $92,938 | $116,000 - $154,000 | 1.45x, engine high |

**Kitchen: validated.** Two independent references bracket 1.0 and both land
inside the quoted range at plausible kitchen sizes. The 0.85 calibration holds.

**Bathroom: validated, on one data point.** The Walden primary bath is the only
genuine bathroom *remodel* on file and it lands inside mid-range across 80-110
sq ft (0.89x to 1.08x). No change made. The Walden hall bath reads 1.53x high
but is **new construction inside an addition** - no demolition, no tear-out, no
working around existing conditions - so it should price below a remodel, and it
lands at the top of `refresh`, about what removing demolition would do. It is
not evidence that the bathroom rate is wrong.

**Whole-home: inconclusive on the data, then raised by owner decision.** Both
references are atypical: the VA proposal carries 40 percent Plans & Admin, and
EST-10049 is a water-damage repair with large areas untouched. The two errors
pointed in **opposite directions** (0.84x and 1.45x), so the data offered no
systematic bias to correct and the recommendation was to leave it alone.

The owner's judgement was that mid-range sat too low, and all tiers were
subsequently scaled by 4/3 (see the whole-home entry under calibrated
categories). Note this does not contradict the test: the only reference that was
a genuine renovation had the engine quoting **low**. After the change the VA
Proposal lands **inside** the quoted range at 1,000-1,200 sq ft. The repair job
now reads further high, which is the expected direction for a job where large
areas were untouched.

This category remains the least evidenced of the three. One clean whole-home
remodel with square footage recorded would settle it.

**Band widths** across all three types run 1.21x to 1.38x, inside the 1.10x to
2.20x guard: never a false single number, never uselessly wide.

**Square footage remains the dominant uncertainty.** Every ratio above assumes a
size. Sensitivity across plausible sizes moves the kitchen references between
0.78x and 1.26x and whole-home between 0.71x and 2.01x. Recording actual square
footage on closed jobs is worth more than any further modeling.

## What a lead sees: scope, not per-line dollars (decided 2026-07)

Leads get the **planning range**, the trades in scope with the quantities the
range was built from, and the includes/excludes list. They do **not** get a
dollar figure per line.

The reasoning: those per-line figures are proportional allocations of a
validated total, not priced quantities. Printing "$11,880 cabinetry" next to a
line claimed a precision the model does not have and handed the homeowner a
negotiating anchor for work nobody had walked yet. It also made the disclaimer
do an unreasonable amount of load-bearing work. The company's own issued
proposals already work this way (EST-10089 lists scope with a single total),
and the website estimate sits *earlier* in the funnel than a proposal, so it
has even less business quoting line-level dollars.

What survives is more useful and less risky: which trades are in scope and the
quantities behind them.

Enforced in the invariant suite: the rendered client estimate must carry
`TAKEOFF_SCOPE_NOTICE`, must not carry `TAKEOFF_BASIS_NOTICE`, and must not
render the priced midpoint subtotal. The **admin** email and the CRM record are
unchanged and still carry the full priced takeoff.

## An issued proposal leaked OH&P to a client

EST-10079 (VA Proposal, Sep 2025) shows a **"Contractor OH&P"** line under a
$54,057 "Plans & Admin" heading on a document that went to a homeowner. That is
the exact disclosure the estimator is built to avoid. It is recorded here
because it is the evidence behind `CLIENT_FORBIDDEN_PHRASES` in
`shared/costCatalog.ts` and the lead-facing vocabulary guard in the invariant
suite: the risk is real and has already materialized once on paper.

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

Run `npm run verify:estimate`,
which asserts every project and finish sits within tolerance of guide-low and
guide-high x 0.8, and that no ceiling ever exceeds what the guide publishes.

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
