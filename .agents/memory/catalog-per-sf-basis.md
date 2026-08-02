---
name: The cost catalog publishes two different kinds of "SF" rate
description: Many catalog SF rates are whole-dwelling per-finished-square-foot budgets, not trade rates per square foot of actual surface; confusing the two silently triples a trade.
---

`shared/costs/lineItemCatalog.ts` publishes per-SF rates that mean one of two
completely different things, and the source workbooks do not distinguish them:

**Per SF of finished floor area** — a whole-dwelling budgeting average. Drywall
$12.50, interior paint $6.00, plumbing $10.00, windows $8.60, electrical $12.00.

**Per SF of the actual surface** — a real trade rate. Roofing $6.00 per square of
roof, siding $9.00 per square of wall, slab $12.00 per square of concrete,
hardwood $20.00 per square of floor laid, insulation $1.50 per square of surface.

**Why it matters:** applying a whole-dwelling rate to a real surface area is
silent and large. Pricing drywall against the 9,120 SF of board a 2,400 SF house
actually hangs, instead of against its 2,400 SF of finished area, gave $71,991
(about $30/SF of finished area) against a market figure near $30,000. The
project total still looked plausible, which is what makes it dangerous.

**The test:** divide the resulting line by finished area and ask whether a
builder would recognise the number as a per-square-foot budget for that trade.
Windows are the clearest tell — $8.60 cannot be a price per square foot of glass,
because that makes a 15 SF window cost $129.

**How it is guarded:** `scripts/verify-new-construction.ts` asserts
per-finished-square-foot cost bounds trade by trade (`budget/<DIVISION>/per-sf-plausible`),
because a whole-project total can absorb one badly based trade and still pass.
It also asserts the engine stays inside the $250-$400/SF band published in
`shared/seoContent.ts`, so the estimator and the website cannot drift apart.

Note the older remodel rules in `scopeRules.ts` handle this with named
`*_INTENSITY` factors per project type, converting room area into equivalent
whole-dwelling area. New construction needs no such factor for the
floor-area-based lines, because a whole house *is* the whole dwelling the rate
was written for.
