# Decisions

## 2026-04-13

- Use Next.js App Router for the local application shell and route map.
- Use Prisma + SQLite for local relational persistence.
- Use local cookie-backed identity simulation for tenant and role switching.
- Keep cloud vendors behind explicit adapter seams; do not wire live providers in v1.
- Use deterministic SQL bootstrapping for local schema setup because Prisma migrate was unreliable on this Windows bootstrap environment.
- Treat `san/state/proof-matrix.*` as the canonical claim-to-evidence control surface for accountable verification.
- Treat expected tenant and portal guard denials as first-class evidence artifacts, but exclude them from runtime-integrity failures when they are deliberate negative-path probes.
- Fingerprint DB reset determinism against stable structural seed state rather than volatile timestamp noise.
- Package Oracle handoff from repo truth plus the latest accountable run, and emit the bundle even if the local Oracle CLI render path is unavailable.
- Make `Offering` the generic root for products, services, and bundles instead of introducing separate product-only and service-only spines.
- Persist prices as first-class records and version them forward instead of mutating prior financial truth in place.
- Route customer graph, lifecycle, scheduling, revenue, portal visibility, automation semantics, and search through the offering/catalog spine.
- Add a dedicated `npm run evidence:catalog` path and include it inside `npm run verify:accountable`.
- Treat blank interval values from catalog forms as valid “no interval” input rather than a validation error.
