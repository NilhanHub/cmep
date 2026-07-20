# Durable State

## Current snapshot

- Repo is an existing CMEP local app under offering-first retrofit verification, not a greenfield bootstrap.
- Stack remains: Next.js App Router, TypeScript, Tailwind, Prisma, SQLite.
- Versioned change-control surface: local Git repository in repo root.
- Canonical local persistence target: SQLite through Prisma.
- Canonical auth mode for v1: local dev identity simulation with tenant and role switching.
- Canonical AI mode for v1: deterministic local provider with optional adapter seam for real providers.
- Canonical claim truth surface: `san/state/proof-matrix.md`.
- Canonical evidence roots: `artifacts/runs/` and `artifacts/oracle/`.

## Active demo shape

- Seeded tenants: `Northstar Studio`, `Signal Goods`
- Supported roles: owner, admin, staff, client
- Runtime supports tenant and role switching from the UI
- Public booking path and scoped client portal path are active

## Offering-first product truth

- CMEP now persists first-class `Offering`, `OfferingVariant`, `OfferingPrice`, `Catalog`, `CatalogItem`, `CatalogAssignment`, `OfferingBundleItem`, `OfferingRouteBinding`, and `CustomerOfferingLink` entities.
- Signal Goods is the product-led tenant with explicit products, services, bundles, recurring pricing, and customer-specific catalog assignments.
- The customer graph, lifecycle, scheduling, revenue, automation, and portal surfaces all consume offering-linked records instead of relying on aggregate prose alone.
- Manual off-catalog revenue lines remain explicit via `isAdHoc` and `adHocReason`.

## Accountability state

- Repo-local observability is active through `src/shared/observability/**` plus Next.js instrumentation entrypoints.
- Accountable verification uses run-scoped artifacts with logs, traces, metrics, state snapshots, HAR, screenshots, DOM snapshots, and Playwright traces.
- Dedicated catalog proof path exists at `npm run evidence:catalog`.
- Oracle handoff is defined by `docs/for-oracle-to-read.*` and curated bundle packaging under `artifacts/oracle/`.
- Latest authoritative claim status is always the current proof matrix, not prior thread narration.

## Latest verified run pointers

- Latest accountable catalog run: `catalog-a39b4696`
- Latest accountable full run: `full-80b1451c`
- Latest verification-suite run: `verify-a066a5be`
- Latest full run path: `artifacts/runs/20260413-154338Z-full-full-80b1451c`
- Latest verify run path: `artifacts/runs/20260413-153948Z-verify-verify-a066a5be`
- Latest Oracle bundle pointer: `artifacts/oracle/latest.json`

## Stable expectations

- Seven core surfaces remain route-reachable and exercised by the accountable flow.
- Local persistence remains active through Prisma Client backed by SQLite.
- Local auth and portal access switching remain active.
- Tenant isolation and portal scoping stay proven by emitted negative-path evidence, not code inspection.
- The offering spine claim stays verified only while `claim.offeringSpine` points at fresh evidence in the proof matrix.
