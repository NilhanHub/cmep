# SANLOCK

Date: 2026-04-13

## Before-work scorecard

- Node graph present: yes
- Control-plane singularity: yes
- Topology drift known: low
- Gravity wells present: `node.sharedDomain`, `node.portal`, `node.observability`
- Split readiness: acceptable, but the catalog spine was still implicit
- Command-first mutation surfaces: present but missing dedicated catalog proof entrypoint
- Verification surface: partial relative to the corrected offering-first concept
- Oracle handoff surface: partial relative to the corrected offering-first concept

## Review triggers

- Any node exceeding 5 percent effective load requires review.
- Any node approaching 10 percent effective load requires a dispersion plan.
- Any multi-tenant surface without scoped repository tests is blocked from final acceptance.
- Any claim without emitted evidence remains unresolved.

## After-work scorecard

- Node graph present: yes
- Control-plane singularity: yes
- Topology drift known: low
- Gravity wells present: `node.sharedDomain`, `node.portal`, `node.observability`
- Split readiness: acceptable for v1, with `node.catalog` now isolated as its own bounded surface
- Command-first mutation surfaces: present for DB, SAN, evidence, Oracle bundle, and catalog verification flows
- Verification surface: pass, including dedicated catalog proof and offering-first accountable reruns
- Oracle handoff surface: pass once the refreshed bundle is emitted
