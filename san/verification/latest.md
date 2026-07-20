# Latest Verification

Date: 2026-04-13

## Commands and results

- `npm run verify:accountable` -> pass (`artifacts/runs/20260413-153948Z-verify-verify-a066a5be/summary.md`)
- `npm run lint` -> pass
- `npm run typecheck` -> pass
- `npm run build` -> pass
- `npm run test` -> pass
- `npm run test:e2e` -> pass
- `npm run san:preflight` -> pass
- `npm run san:lock` -> pass
- `npm run san:graph:validate` -> pass
- `npm run evidence:catalog` -> pass (`artifacts/runs/20260413-154218Z-catalog-catalog-a39b4696/summary.md`)
- `npm run evidence:full` -> pass (`artifacts/runs/20260413-154338Z-full-full-80b1451c/summary.md`)
- `npm run oracle:bundle` -> pass (`artifacts/oracle/latest.json`)

## Evidence summary

- Latest accountable catalog run: `catalog-a39b4696`
- Latest accountable full run: `full-80b1451c`
- Latest verification-suite run: `verify-a066a5be`
- Proof matrix status:
  - local boot: verified
  - 7 surfaces end to end: verified
  - tenant isolation: verified
  - portal scoping: verified
  - Windows-local DB determinism: verified
  - runtime integrity: verified
  - offering/catalog spine: verified
  - Oracle offline review: verified
- Accountable full run emitted logs, traces, metrics, exceptions, state snapshots, HAR, screenshots, DOM snapshots, UI state, Playwright trace, and scenario results.
- Expected guard denials were captured for cross-tenant update, cross-client portal reply, and cross-client quote decision. No unexpected server exceptions or browser page errors were captured in the latest full run.
- Offering-spine proof added a new service offering, variant, price version, catalog assignment, lifecycle record, booking, quote, invoice, and portal visibility check through the catalog path.
- Curated Oracle bundle pointer: `artifacts/oracle/latest.json`
- Latest Downloads zip is recorded in that pointer file.
- Oracle bundle command passes local Oracle CLI dry-run/render and emits bundle-local command files, manifest, summary, and a Downloads zip.
