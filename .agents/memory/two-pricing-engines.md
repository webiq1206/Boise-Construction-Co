---
name: Two pricing engines — line-item engine wins
description: The quoted price range comes from the line-item cost engine, not the older guide engine; new pricing inputs must be wired into both.
---

The calculator and both server routes take the displayed/emailed price from the line-item cost engine (`shared/costs/*`, via `resolveQuotedRange`). The older guide engine (`shared/estimateEngine.ts`) still supplies ROI, inclusions, confidence, and the market ceiling — but its priceLow/priceHigh are overridden.

**Why:** Bathroom count was correctly priced in the guide engine (instance multiplier) but the line-item engine ignored it, so the selection silently had no effect on the on-screen range until fixed (July 2026).

**How to apply:** Any new selection that should move the price must be wired into the scope rules / engine under `shared/costs/`, not just `estimateEngine.ts`. Bathroom-project semantics: sqft = size of EACH bathroom, count multiplies the whole takeoff; `fixtureCount` is per-bathroom (comes from the subtype card). Also note the market-ceiling guard is single-unit; multi-bath quotes trim to the margin floor (follow-up exists).
