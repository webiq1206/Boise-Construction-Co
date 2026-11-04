# Boise search-page improvement receipt

Status: implemented; final testing and independent review pending. Not imported,
not published, not live-verified. Started 2026-11-04 UTC.

## Scope and preservation

Mode: focused existing-page edit for a local service business. Authorized scope
is `/areas/boise` and `/services/custom-home-builder/boise`. The first answers
parcel/jurisdiction and lot-planning questions; the second explains the custom
build scope and preparation for the design-build conversation. Existing useful
sections, URLs, canonical/indexability policy, metadata, H1s, FAQ data, costs,
timelines, image labels and journeys remain. No new city pages, disposition,
schema type, price or credential is introduced.

Standards: website-design-quality master and implementation rules 2.3, organic
search 1.0.0. Current source profile: `docs/brand-profile.md`, source-b7b443f.
Implementation owner: this scoped Codex task; final reviewer must be separate.
The complete current standards were read before visual source edits. This task
is not a cross-site visual/conversion pattern rollout.

## Source, concurrency and production baseline

- Fresh clean clone of `webiq1206/Boise-Construction-Co`, main
  `b7b443f460bc5077e8d71b60fa8f5012cbe33672`; remote refreshed before branch creation.
- Branch: `codex/construction-boise-search-20261104`.
- Historical P5 owner confirmed no writes/builds/tests/browser lease or pending
  release and relinquished ownership; parent confirmed no active native
  Construction writer. No conflicting active owner was found.
- Cursor draft PR122 remains open and untouched, head
  `1189d1e4b750f8eb77d418e39be6e39eb7fa9108`. Direct agent status remains
  unverified (connector disconnected, browser sign-in required). Do not merge
  it automatically. Refresh concurrency again before merge/import/release.
- Verified Replit binding: `722a9d7a-e272-45fc-82f8-945b4079b6da`,
  `https://replit.com/@webiqco/Boise-Construction-Co`, published domain
  `https://boiseconstruction.co`; current deployment reports success.
- Public release receipt: SHA `644bad1aaf5b09372aa50c2a201a399d1dfa1e0e`,
  tree `feb5e5e43893a5519ac80f1cf82ea7345c197e94`, dirty true,
  builtAt `2026-11-04T00:18:01.117Z`, empty source digest and changed-path list.
  This cannot prove equality with current main or a reproducible deployed tree.
  Reconcile Replit local changes before an import; preserve all unrelated work.

## Inventory and baseline

Existing records consulted: `docs/keyword-map.md`, `docs/INTERNAL-LINKING.md`,
`docs/interior-route-audit.json`, audit/template records, `.agents` content and
memory instructions, current route expansion and sitemap. The archived
SEO-AUDIT-INVENTORY still names the historical Remodeling source and is not a
current Construction inventory. This receipt extends the scoped change record;
it does not claim a new all-site audit.

Affected rendered URLs: exactly the two above. The added content is selected by
the Boise slug and, for the service route, the custom-home-builder slug. All
other shared-template consumers retain their existing content.

Parent-supplied actual GSC baseline, final web October 4–31: Construction 2 clicks,
61 impressions, average position 36.87; matched September 6–October 3: 0 clicks,
80 impressions, 40.00. Low exposure limits inference. The service Boise page was
crawled but not indexed; the area page was unknown to Google; both were live and
in the sitemap. No causal claim or ranking deadline is made.

Before evidence: task `evidence/before` raw HTML/headers and
`evidence/construction/before-production`, `before-source` browser captures and
records. Chromium emulation at 360x640, 390x844, 768x1024 and 1440x900: both pages
returned 200, one H1 and expected self-canonical; no horizontal overflow. The
unchanged source baseline build passed. These results are scoped observations.

## Claim and link ledger

| Change | Evidence / qualification |
| --- | --- |
| One design-build team; line-item budget; weekly written updates; written warranty | Existing `shared/seoContent.ts` custom service, approved site copy and `.agents/content-brief-new-construction.md`; no new promise. |
| Address jurisdiction needs checking | Existing `lib/permitGuidance.ts` and approved permit-flow resource; mailing address is not treated as proof of city jurisdiction. No rule, fee, deadline or approval is promised. |
| Parcel/survey/access/utilities/soils/restrictions checklist | Practical preparation recommendations consistent with existing lot-evaluation scope. Missing documents are not represented as completed work. |
| City application-record lookup | Official `https://permits.cityofboise.org/citizenaccess/Default.aspx`, verified accessible by the coordinating parent on November 4. This executor's web reader returned 403; no unverified regulatory detail is extracted. A prior permit is explicitly not a new approval. |
| Drawings/room needs/budget preparation | Existing custom-home process and plan-review scope; planning range remains distinct from bid/permit decision. |
| Completed-project proof | No verified Boise completed-project artifact in the current gallery/provenance records. Existing concepts stay labeled; no fabricated proof added. |

Donor/target additions: area to Boise custom service, lot evaluation and Boise
guide plus official records; Boise custom service to area lot-planning overview,
home plans/design, own-lot service and regional custom-service hub. Existing
contextual links are retained. No mechanical link rotation.

## Planned and completed checks

- PASS: clean baseline, source/production binding read, protected baseline raw
  HTML and focused mobile/tablet/desktop captures, unchanged-source normal build.
- PASS: final TypeScript check, all 22 existing approved-interiors SEO-contract
  tests and final normal build/prebuild. The unchanged base normal build also
  passed. Generated PDF timestamp differences were excluded from the change.
- PASS: eight final browser observations at the baseline dimensions, with 200
  responses and no horizontal overflow; title/description/canonical/robots/H1
  and loaded fonts unchanged. Existing non-TOC main links retained. The FAQ,
  breadcrumb and other non-Service schema are unchanged; the Service description
  matches the revised visible overview. New detail is present in raw server
  HTML. All seven scoped local link targets returned 200.
- Evidence: task `evidence/construction/after-source/record.json`, per-page
  comparison grids, `preservation-comparison.json`,
  `raw-schema-link-check.json`, and `construction-{base-build,after-build,types,interiors}.log`.
- PENDING: independent ten-dimension visual/functional review and exact-revision
  evidence. Captures are Chromium viewport emulation, not physical devices.
- NOT APPLICABLE: new layout/tokens, image changes, input steps, wizard behavior,
  calculator math and new interactive proof. Those are unchanged and this focused
  edit does not authorize retrofits.
- NOT RUN: physical-device/on-screen keyboard testing, downstream lead delivery,
  provider or protected estimator operations, field performance. No form/lead
  submission, paid Replit Agent, new spending or credential/security change.
- BLOCKED/PENDING: qualified Replit import/publication/live comparison until
  current workspace state and release gates are reconciled. Source merge is not
  deployment. Parent owns supported indexing requests after live verification.

## Release checkpoints

Refresh remote main/PRs and owner state; independently review final revision;
create scoped reviewable PR; satisfy merge gates. Before Replit import, preserve
local-only work and inspect hooks. `scripts/post-merge.sh` can prepare database
schema; `replit.md` requires safe synchronization and actual publish-diff review.
Never approve a DROP or data overwrite. Preserve environment/database bindings.
Import, publication and live verification each need separate receipts.

Recovery: base main commit above and scoped Git diff/branch. Exact final commit,
PR, final evidence, review result and release receipts will be appended after
they exist. Parent retains baseline and follow-up measurement ownership; no
duplicate schedule or indexing submission was created.

## Bounded review-gate remediation

Parent explicitly authorized repairing the independently verified C3 hero-fit
and C12 enlarged-text defects on the two affected pages. `priorityPlanning`
opts in only Boise area and Boise custom-home service. The shared template's
other 107 generated consumers retain the original branch and styles. The new
CSS module leaves family chrome and its hash manifest untouched.

The hero retains H1, opening answer and primary quote action. Existing breadcrumb,
eyebrow, phone and planning detail remain in the immediately adjacent overview.
No price, timeline, credential, service claim, URL, metadata, form or estimator
policy changes. Hero padding/type use the established tier tokens; recognizable
architectural concepts stay labeled. The long-form grid explicitly permits
shrinkage and word wrapping for enlarged text. Global overflow rules are retained.

Normal build/prebuild, TypeScript and all 22 existing interior-contract tests
pass after the repair. Matching before/after evidence covers 320x568,360x640,
390x844,430x932,768x1024,1024x768,1280x720,1440x900,1920x1080. Independent rendered
acceptance is pending, not inferred from those tests.

The unrelated baseline RE-10 browser-check failure remains open. Its strict
locator matches both valid handoff links. An assertion-preserving proposed fix
checks both links, exact destinations and unobstructed access, but the helper
is protected by the shared-engine manifest. Prebuild rejected a local mirror edit;
that edit was reverted without changing the guard. Canonical-source ownership
and sync authorization are needed before this CI repair. Do not bypass the check
or mark CI passed from the normal build.

Draft PR124 is the reviewable source destination. Merge/publication authority
was subsequently supplied explicitly, conditional on passing tests and review.
No import or publication has been attempted. Authenticated Replit workspace
inspection and preservation of local-only work remain prerequisites. The browser
transport is currently unavailable; no outcome is uncertain.

Independent review then exercised actual 200% text resizing, including fixed-pixel
labels, rather than root-font enlargement alone. It found baseline bar, phone,
process-grid and email wrapping failures. The second bounded correction inherits
word wrapping within the same opt-in pages, permits grid children to shrink,
wraps the existing bar labels and footer email, and observes that bar's rendered
height to reserve matching spacer/focus clearance. The observer restores its
page-specific styles on unmount. It adds no overlay or new business workflow.
All shared chrome/engine bytes and recorded manifests remain unchanged.

The current browser can inspect both exact Replit URLs but shows an authenticated
access page: the visible display name is Jared and the app owner must grant that
account access. The plugin independently still resolves the two expected editable
projects. No invitation, identity/credential change, Agent operation, import or
publication occurred. Use the existing authorized owner session/importer; do not
infer import access from connector metadata or successful baseline deployment.
