# Recurring Failures

## 2026-04-13

- Prisma migrate and schema-engine bootstrap were unreliable on this Windows environment. The repo uses deterministic SQL export plus seed for local setup and reset while keeping Prisma Client for runtime access.
- Windows-local SQLite resets can hit transient file locks when a verification script holds an open client. The evidence runner disconnects between state snapshots, and DB file deletion retries `EBUSY` and `EPERM` before failing.
- Negative-path tenant and portal probes intentionally emit guarded `403` and `404` exceptions. These remain evidence, but they do not count as runtime-integrity failures.
- Raw HAR and Playwright trace artifacts can exceed the Oracle CLI 1 MB per-file limit. The bundle generator keeps those files in the curated zip, emits an oversize manifest, and excludes them from the Oracle CLI file list so dry-run and render still succeed.
- Catalog forms can submit empty-string select values from the browser. Validation has to explicitly normalize blank interval values to `undefined` or the UI turns a valid “no interval” choice into a false failure.
- Variant-level prices can drift out of the flagship offering detail if the UI only renders base-offering prices. The detail surface now renders both offering-level and variant-level pricing cards; future catalog changes should preserve that invariant.
