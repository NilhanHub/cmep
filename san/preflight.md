# SAN Preflight

Date: 2026-04-13

## Operating mode classification

- `MID_BUILD_ALIGNMENT`
- `MAINTENANCE`
- `OUTWARD_HANDOFF`

## Authority findings before work

1. Canonical doctrine surface: `AGENTS.md`
2. Canonical control plane: `san/control-plane.md`
3. Canonical durable state surface: `san/state/durable-state.md`
4. Canonical claim-to-evidence surface: `san/state/proof-matrix.md`
5. Canonical change-control surface: local Git repository in repo root
6. Execution entrypoints: npm scripts in `package.json`
7. Verification entrypoints: lint, typecheck, unit tests, e2e, SAN scripts, evidence scripts, Oracle bundle script
8. Conditioned doctrines active:
   - stateful system rehydration
   - long-horizon resumability
   - purpose-scoped execution contexts
   - no-excuses accountability
9. Machine-readable topology graph: `san/topology/graph.json`

## Drift and risk findings before work

- Prior accountable runs proved the workflow shell, not the corrected offering-first product concept.
- The proof matrix needed a new canonical claim for the offering/catalog spine.
- The repo needed first-class offering, variant, price, catalog, and customer-offering truth instead of workflow inference.
- The evidence runner and Oracle docs needed to understand the new claim explicitly.

## SAN scorecard before work

- Canonical doctrine: pass
- Canonical control plane: pass
- Durable state surface: pass
- Versioned change surface: pass
- Deterministic entrypoints: pass
- Machine-readable topology: pass
- Rehydration contract: pass
- Verification evidence: partial until retrofit rerun
- Oracle handoff surface: partial until retrofit rerun
