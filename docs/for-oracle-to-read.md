# For Oracle to Read

## Objective

Determine whether CMEP v1 is genuinely working end-to-end locally on this machine as an offering-first CME platform. Review the code and emitted evidence to decide whether the local app now proves a first-class product and service catalog spine across the seven core surfaces, while tenant isolation and portal scoping remain intact.

## Current Failure or Uncertainty

- Prior accountable runs proved a workflow-centric local app, not the intended offering-first concept.
- The repo has now been retrofitted and rerun, but Oracle must independently verify the new claim from evidence rather than from self-report.
- Current focus claim:
  - `claim.offeringSpine`: `CMEP has a first-class offering/catalog spine and the core business flows route through it end-to-end.`
- Oracle should still check for these failure classes explicitly:
  - hidden aggregate-only flows that bypass offerings, variants, prices, or catalogs
  - silent off-catalog defaults where an explicit exception flag should exist
  - cross-tenant catalog leakage
  - cross-client portal catalog leakage
  - runtime or hydration defects that only show up under the accountable run

## Exact Reproduction

1. `npm install`
2. `copy .env.example .env`
3. `npm run db:setup`
4. `npm run evidence:catalog`
5. `npm run verify:accountable`
6. Inspect:
   - `artifacts/runs/20260413-154218Z-catalog-catalog-a39b4696`
   - `artifacts/runs/20260413-154338Z-full-full-80b1451c`
   - `artifacts/runs/20260413-153948Z-verify-verify-a066a5be`
   - `san/state/proof-matrix.md`
   - `san/verification/latest.md`
7. Build the handoff with `npm run oracle:bundle`

## Expected Behavior

- The app boots locally from documented commands.
- First-class `Offering`, `OfferingVariant`, `OfferingPrice`, `Catalog`, `CatalogAssignment`, `OfferingRouteBinding`, and `CustomerOfferingLink` entities exist.
- The seven core surfaces work locally and route through the offering/catalog spine where appropriate.
- Customer detail explicitly shows offering relationship states.
- Quotes and invoices derive line items from offering prices by default.
- Service bookings originate from service offerings or service variants.
- Portal catalog visibility and requestability are constrained by catalog assignment.
- Search and automation semantics can target offering, variant, family/category, catalog, and customer-offering status.
- Cross-tenant and cross-client tampering attempts are denied.
- DB reset fingerprints remain deterministic.
- No unexpected server exceptions, browser page errors, dead critical controls, or hidden hydration blockers appear in the accountable flow.

## Actual Behavior

- The latest proof matrix currently marks the offering spine and the original accountability claims as verified from:
  - `artifacts/runs/20260413-154338Z-full-full-80b1451c`
- The latest dedicated catalog proof run is:
  - `artifacts/runs/20260413-154218Z-catalog-catalog-a39b4696`
- The latest accountable verification sweep is:
  - `artifacts/runs/20260413-153948Z-verify-verify-a066a5be`
- Oracle must still confirm whether those verdicts are justified by the evidence, or whether any claim should be downgraded to falsified or blocked.

## Relevant Paths

- `README.md`
- `AGENTS.md`
- `san/control-plane.md`
- `san/state/proof-matrix.md`
- `san/state/proof-matrix.json`
- `san/verification/latest.md`
- `san/topology/graph.json`
- `san/contracts/rehydration-truth-contract.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/seed-offering-spine.ts`
- `src/modules/catalog/**`
- `src/modules/customer-graph/**`
- `src/modules/lifecycle/**`
- `src/modules/scheduling/**`
- `src/modules/revenue/**`
- `src/modules/portal/**`
- `src/modules/automation/**`
- `src/modules/shell/**`
- `src/shared/observability/**`
- `src/tests/e2e/cmep-accountable.spec.ts`
- `scripts/evidence/**`
- `scripts/oracle/**`

## Required Artifacts

- `artifacts/runs/20260413-154218Z-catalog-catalog-a39b4696/**`
- `artifacts/runs/20260413-154338Z-full-full-80b1451c/**`
- `artifacts/runs/20260413-153948Z-verify-verify-a066a5be/**`
- `summary.md`
- `app.log.jsonl`
- `events.jsonl`
- `trace.ndjson`
- `metrics.json`
- `state-before.json`
- `state-after.json`
- `scenario-results.json`
- `exception.json`
- `network.har`
- `playwright-trace.zip`
- `screenshots/`
- `dom/`
- `ui-states/`
- proof matrix snapshot
- Oracle bundle manifest

## Oracle Bundle Recipe

Run `npm run oracle:bundle`, then inspect `artifacts/oracle/latest.json`. Oracle should review:

- code
- SAN control-plane and state surfaces
- tests
- logs
- metrics
- traces
- HAR
- screenshots
- DOM snapshots
- state snapshots

Oracle must determine claim-by-claim whether the app is proven, falsified, or blocked.

PowerShell command target:

```powershell
npx -y @steipete/oracle --render --copy ^
  -p "Review this CMEP accountability bundle. Determine claim-by-claim whether the local app is proven working, falsified, or blocked. Use code, SAN surfaces, tests, logs, metrics, traces, HAR, screenshots, DOM snapshots, state snapshots, and run artifacts. Identify the highest-severity exact root causes, the smallest patch plan, and any blind spots caused by missing evidence. Do not guess." ^
  --file "repo/docs/for-oracle-to-read.md,repo/docs/for-oracle-to-read.yaml,repo/docs/governance/no-excuses-app-accountability-protocol.md,repo/README.md,repo/AGENTS.md,repo/san/control-plane.md,repo/san/preflight.md,repo/san/sanlock.md,repo/san/verification/latest.md,repo/san/state/durable-state.md,repo/san/state/decisions.md,repo/san/state/open-questions.md,repo/san/state/proof-matrix.md,repo/san/state/proof-matrix.json,repo/san/recurrence/failures.md,repo/san/contracts/rehydration-truth-contract.md,repo/san/topology/graph.json,repo/package.json,repo/next.config.ts,repo/playwright.config.ts,repo/vitest.config.ts,repo/tsconfig.json,repo/prisma/schema.prisma,repo/prisma/seed.ts,repo/prisma/seed-offering-spine.ts,repo/scripts/db/setup.ts,repo/scripts/db/reset.ts,repo/scripts/db/migrate.ts,repo/scripts/evidence/**,repo/scripts/oracle/bundle.ts,repo/scripts/san/**,repo/src/instrumentation.ts,repo/src/instrumentation-client.ts,repo/src/shared/observability/**,repo/src/shared/domain/constants.ts,repo/src/shared/domain/schemas.ts,repo/src/shared/server/prisma.ts,repo/src/modules/catalog/**,repo/src/modules/customer-graph/**,repo/src/modules/inbox/**,repo/src/modules/lifecycle/**,repo/src/modules/scheduling/**,repo/src/modules/revenue/**,repo/src/modules/portal/**,repo/src/modules/automation/**,repo/src/modules/shell/**,repo/src/modules/identity-tenant/**,repo/src/app/app/page.tsx,repo/src/app/app/catalog/page.tsx,repo/src/app/app/catalog/[id]/page.tsx,repo/src/app/app/customers/[id]/page.tsx,repo/src/app/app/inbox/page.tsx,repo/src/app/app/lifecycle/page.tsx,repo/src/app/app/automations/page.tsx,repo/src/app/app/schedule/page.tsx,repo/src/app/app/revenue/quotes/page.tsx,repo/src/app/app/revenue/quotes/[id]/page.tsx,repo/src/app/app/revenue/invoices/page.tsx,repo/src/app/app/revenue/invoices/[id]/page.tsx,repo/src/app/client/page.tsx,repo/src/app/api/catalog/offerings/route.ts,repo/src/app/api/catalog/variants/route.ts,repo/src/app/api/catalog/prices/route.ts,repo/src/app/api/catalog/assignments/route.ts,repo/src/app/api/customers/route.ts,repo/src/app/api/customers/[id]/route.ts,repo/src/app/api/inbox/conversations/[id]/messages/route.ts,repo/src/app/api/lifecycle/items/route.ts,repo/src/app/api/lifecycle/items/[id]/move/route.ts,repo/src/app/api/schedule/bookings/route.ts,repo/src/app/api/schedule/bookings/[id]/route.ts,repo/src/app/api/revenue/quotes/route.ts,repo/src/app/api/revenue/quotes/[id]/decision/route.ts,repo/src/app/api/revenue/invoices/route.ts,repo/src/app/api/revenue/invoices/[id]/payments/route.ts,repo/src/app/api/portal/access/route.ts,repo/src/app/api/portal/conversations/[id]/reply/route.ts,repo/src/app/api/automation/simulate/route.ts,repo/src/app/api/search/route.ts,repo/src/tests/e2e/cmep-accountable.spec.ts,repo/src/tests/e2e/cmep-smoke.spec.ts,repo/src/tests/e2e/evidence-utils.ts,repo/src/tests/e2e/global-setup.ts,repo/src/tests/integration/offering-routing.test.ts,repo/src/tests/integration/automation-flow.test.ts,repo/src/tests/unit/offering-spine.test.ts,repo/src/tests/unit/tenant-isolation.test.ts,repo/src/tests/unit/evidence-artifacts.test.ts,runs/20260413-154338Z-full-full-80b1451c/summary.md,runs/20260413-154338Z-full-full-80b1451c/scenario-results.json,runs/20260413-154338Z-full-full-80b1451c/exception.json,runs/20260413-154338Z-full-full-80b1451c/stdout.log,runs/20260413-154338Z-full-full-80b1451c/stderr.log,runs/20260413-154338Z-full-full-80b1451c/metrics.json,runs/20260413-154338Z-full-full-80b1451c/state-before.json,runs/20260413-154338Z-full-full-80b1451c/state-after.json,runs/20260413-154338Z-full-full-80b1451c/state-reset-a.json,runs/20260413-154338Z-full-full-80b1451c/state-reset-b.json,runs/20260413-154338Z-full-full-80b1451c/app.log.jsonl,runs/20260413-154338Z-full-full-80b1451c/events.jsonl,runs/20260413-154338Z-full-full-80b1451c/trace.ndjson,runs/20260413-154338Z-full-full-80b1451c/browser-console.jsonl,runs/20260413-154338Z-full-full-80b1451c/browser-network.jsonl,runs/20260413-154338Z-full-full-80b1451c/browser-network-failures.jsonl,runs/20260413-154338Z-full-full-80b1451c/exceptions.jsonl,runs/20260413-154338Z-full-full-80b1451c/proof-matrix-snapshot.json,runs/20260413-154338Z-full-full-80b1451c/build-meta.json,runs/20260413-154338Z-full-full-80b1451c/effective-config.sanitized.json,runs/20260413-154338Z-full-full-80b1451c/feature-flags.json,runs/20260413-154338Z-full-full-80b1451c/inputs.sanitized.json,runs/20260413-154338Z-full-full-80b1451c/seed-identifiers.json,runs/20260413-154338Z-full-full-80b1451c/ui-state.json,runs/20260413-154338Z-full-full-80b1451c/ui.png,runs/20260413-154338Z-full-full-80b1451c/screenshots/**,runs/20260413-154338Z-full-full-80b1451c/dom/**,runs/20260413-154338Z-full-full-80b1451c/ui-states/**,runs/20260413-153948Z-verify-verify-a066a5be/summary.md,runs/20260413-153948Z-verify-verify-a066a5be/commands/**,runs/20260413-153948Z-verify-verify-a066a5be/verification-results.json,runs/20260413-153948Z-verify-verify-a066a5be/build-meta.json,runs/20260413-153948Z-verify-verify-a066a5be/effective-config.sanitized.json,runs/20260413-153948Z-verify-verify-a066a5be/feature-flags.json,runs/20260413-153948Z-verify-verify-a066a5be/inputs.sanitized.json,runs/20260413-153948Z-verify-verify-a066a5be/screenshots/**,oracle-prompt.md,bundle-selection-rationale.md,oracle-oversize-artifacts.json,oracle-oversize-artifacts.md,!repo/node_modules/**,!repo/.next/**,!repo/coverage/**,!repo/playwright-report/**,!repo/**/.env,!repo/**/.env.*,!repo/**/*.db,!repo/**/*.sqlite"
```

Large binary artifacts such as `network.har`, `playwright-trace.zip`, and video captures remain inside the curated bundle directory and zip, but stay out of the Oracle CLI payload when they would bloat or destabilize the prompt. Inspect them from the bundle root when the text payload is insufficient.

## Sanitization Rules

- Do not include raw `.env` files, secrets, cookies, or unsanitized portal keys.
- Use stable hashed or pseudonymous identifiers when exporting tenant, user, or portal scope context.
- Do not include raw SQLite or DB files unless a defect cannot be diagnosed without them.
- Prefer emitted summaries, traces, logs, screenshots, and DOM snapshots over raw storage dumps.

## Acceptance Evidence Required

- claim-by-claim verdicts: verified, falsified, or blocked
- exact evidence files used for each verdict
- highest-severity root causes, if any
- minimum patch plan, including exact files to change
- explicit blind spots caused by missing evidence only
- explicit verdict on:
  - first-class offering and catalog entities
  - real customer-to-offering mapping
  - quotes, invoices, bookings, lifecycle, portal, search, and automation routing through offering semantics
  - explicit ad hoc revenue exceptions instead of silent defaults

## Known Suspects / Hypotheses

- Revenue line-item derivation and portal visibility remain the highest-sensitivity offering-first seams.
- Booking-source truth and lifecycle-route defaults are correct in the evidence path, but Oracle should still look for generic fallback behavior outside that path.
- The Windows-local DB claim should still be judged on structural determinism, not volatile timestamp equality.

## Recent Instrumentation Changes

- Added dedicated `evidence:catalog` run support.
- Expanded state snapshots to include catalog and customer-offering counts and latest records.
- Extended the accountable Playwright flow to create a new offering, add a variant, version pricing, assign a catalog, create offering-linked lifecycle and revenue records, and prove tenant and portal restriction on that new catalog truth.
