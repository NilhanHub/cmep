# CMEP Agent Doctrine Map

This repository operates as a Stateless-Agent-Native (SAN) repo with a no-excuses accountability overlay.

Canonical surfaces:
- Doctrine map: `AGENTS.md`
- Control plane: `san/control-plane.md`
- Durable state: `san/state/durable-state.md`
- Proof matrix: `san/state/proof-matrix.md`
- SAN preflight log: `san/preflight.md`
- SANLOCK scorecard and drift review: `san/sanlock.md`
- Machine-readable topology truth: `san/topology/graph.json`
- Rehydration authority contract: `san/contracts/rehydration-truth-contract.md`
- Latest verification evidence: `san/verification/latest.md`
- Oracle instruction surface: `docs/for-oracle-to-read.md`
- Accountability protocol reference: `docs/governance/no-excuses-app-accountability-protocol.md`

Authority rules:
1. `AGENTS.md` is the repo-local doctrine entrypoint.
2. `san/control-plane.md` is the write-authoritative operational control plane.
3. `san/state/*` carries durable repo memory, claim truth, and current operating state.
4. `san/topology/graph.json` is the authoritative bounded-node graph.
5. `san/state/proof-matrix.*` is the canonical claim-to-evidence map.
6. `CLAUDE.md` is a mirror pointing back here.

Current operating modes:
- `MID_BUILD_ALIGNMENT`
- `MAINTENANCE`
- `OUTWARD_HANDOFF`

Execution rules:
- Treat all serious work as versioned, diffable changes.
- Update SAN state, proof state, and verification evidence in the same slice as code changes.
- Prefer command-backed deterministic mutations for repeated or coupled repo updates.
- Keep nodes split-ready; avoid catch-all utilities and hidden mutable state.
- All user data access must remain tenant-scoped.
- If a claim cannot be proven from emitted artifacts, mark it unresolved and name the missing evidence or blocking defect.
- Accountable verification runs must emit protocol-compliant artifacts under `artifacts/runs/`.
- Oracle handoff must be possible from repo truth plus curated bundle contents alone.

Primary entrypoints:
- app dev server: `npm run dev`
- local reset: `npm run demo:reset`
- accountable verification: `npm run verify:accountable`
- direct evidence run: `npm run evidence:full`
- Oracle bundle: `npm run oracle:bundle`

Next.js note:
- This repo uses Next.js 16 App Router. Before changing framework behavior, read the relevant guide in `node_modules/next/dist/docs/`.
