# GBP Phase 1 — SAB Video Verification Kit

Profile status: **created, not yet verified**. Complete Phase 0 citation cleanup first.

## Documents to gather (one PDF bundle if reinstatement needed)

- [ ] Idaho Secretary of State certificate for **Boise Remodeling Co LLC**
- [ ] Proof of insurance/bond naming **Boise Remodeling Co** (or Boise Remodeling Co LLC)
- [ ] Utility bill or lease at registered business address (within 60 days)
- [ ] Optional: vehicle wrap, yard sign, or branded equipment photos

## GBP fields before submitting verification

| Field | Value |
|-------|-------|
| Business name | `Boise Remodeling Co` (exact — no LLC, no keywords) |
| Phone | `(208) 477-1169` |
| Website | `https://boiseremodeling.co` |
| Address | Real registered address (private) + **hide from public** |
| Service area model | "I deliver goods and services to my customers" |
| Service areas | Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, ID |
| Primary category | Remodeler |

## Video verification script (single continuous take at registered address)

Record one unedited video showing, in order:

1. Your face on camera
2. Idaho SOS certificate — business name clearly visible
3. Insurance/bond document — business name clearly visible
4. Mail or utility bill at this address
5. Branded vehicle, tools, or signage (if available)

**Rules:**

- One submission only — duplicate attempts reset the queue
- Record at the **same address** entered in GBP
- If suspended later: [reinstatement form](https://support.google.com/business/troubleshooter/2690129) — one PDF bundle, one submission

## After verification lands

1. Apply full profile spec → [02-gbp-plan.md](./02-gbp-plan.md)
2. Print copy-paste blocks: `npx tsx scripts/print-gbp-profile.ts`
3. Set env vars:
   - `NEXT_PUBLIC_GBP_URL` — Maps listing short link
   - `NEXT_PUBLIC_GBP_REVIEW_URL` — Review short link (powers `boiseremodeling.co/review`)
4. Create Bing Places (import from GBP) + Apple Business Connect same week
