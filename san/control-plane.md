# CMEP Control Plane

## Canonical authority

- Canonical doctrine surface: `AGENTS.md`
- Canonical control plane: `san/control-plane.md`
- Canonical durable state: `san/state/durable-state.md`
- Canonical proof matrix: `san/state/proof-matrix.md`
- Canonical topology truth: `san/topology/graph.json`
- Canonical verification evidence: `san/verification/latest.md`
- Canonical Oracle instruction surface: `docs/for-oracle-to-read.md`
- Canonical accountability overlay reference: `docs/governance/no-excuses-app-accountability-protocol.md`

Mirrors:
- `CLAUDE.md` mirrors `AGENTS.md`

## Current operating modes

- `MID_BUILD_ALIGNMENT`
- `MAINTENANCE`
- `OUTWARD_HANDOFF`

## Product mission

Prove and maintain CME Platform v1 as a local-first, visual-first, offering-first, multi-tenant customer management and engagement system. The canonical local product spine is now:

- offerings
- variants
- prices
- catalogs
- catalog assignments
- route bindings
- customer-offering links

The seven working surfaces remain:

- unified customer graph
- omnichannel inbox
- lifecycle canvas
- automation studio
- scheduling and intake
- revenue actions
- client workspace

## Canonical execution entrypoints

- app dev server: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- unit and integration tests: `npm run test`
- e2e smoke tests: `npm run test:e2e`
- db setup: `npm run db:setup`
- db migrate/reset refresh: `npm run db:migrate`
- seed refresh: `npm run db:seed`
- demo reset: `npm run demo:reset`

## Canonical accountability entrypoints

- evidence smoke: `npm run evidence:smoke`
- evidence isolation: `npm run evidence:isolation`
- evidence catalog: `npm run evidence:catalog`
- evidence full: `npm run evidence:full`
- accountable verification sweep: `npm run verify:accountable`
- Oracle bundle packaging: `npm run oracle:bundle`
- latest Oracle bundle pointer: `npm run oracle:latest`

## Canonical SAN entrypoints

- SAN preflight: `npm run san:preflight`
- SANLOCK pass: `npm run san:lock`
- topology validation: `npm run san:graph:validate`

## Artifact classes

- doctrine: `AGENTS.md`, `san/control-plane.md`
- machine recovery state: `san/state/*`
- topology truth: `san/topology/graph.json`
- verification evidence: `san/verification/latest.md`, `artifacts/runs/*`
- Oracle handoff: `docs/for-oracle-to-read.*`, `artifacts/oracle/*`
- outward narrative and migration docs: `README.md`, `docs/roadmap/*`
- product source truth: `src/**`, `prisma/**`, `scripts/**`

## Non-negotiable repo laws

1. Tenant scoping is mandatory for every data access path.
2. The offering/catalog spine is first-class durable truth, not seed prose or workflow inference.
3. Quotes and invoices derive from offering prices by default; ad hoc lines stay explicit exceptions.
4. Portal visibility is constrained by catalog assignment and client scope.
5. Control-plane truth lives in repo artifacts, not chat memory.
6. Every serious slice updates SAN state and verification evidence.
7. Claims must map to emitted evidence or remain explicitly unresolved.

## Bounded nodes

- `node.shell`
- `node.identityTenant`
- `node.catalog`
- `node.customerGraph`
- `node.inbox`
- `node.lifecycle`
- `node.automation`
- `node.scheduling`
- `node.revenue`
- `node.portal`
- `node.aiAssist`
- `node.observability`
- `node.evidenceOps`
- `node.sharedUi`
- `node.sharedDomain`
