# Local to Supabase

## Stable seams

These boundaries remain stable:
- route map and UI modules
- tenant/membership model
- repository contracts
- AI provider interface
- storage and notification adapters

## Adapters that change

- auth adapter: local persona cookies -> Supabase Auth session
- persistence adapter: Prisma/SQLite -> Postgres repositories
- storage adapter: local filesystem -> Supabase Storage
- tenant isolation policy: app-level tenant guards -> Postgres + RLS policy layer

## Auth migration steps

1. Add a Supabase auth adapter beside the local auth adapter.
2. Map Supabase user id to existing `User` rows.
3. Resolve memberships after sign-in and keep tenant selection UI for multi-membership users.
4. Add Google Auth later via Supabase social providers if desired.

## Data migration concerns

- Preserve ids where practical to avoid portal and file reference churn.
- Convert JSON-heavy SQLite fields carefully to JSONB in Postgres.
- Move automation rules and logs with tenant ids indexed early.
- Add explicit database constraints for tenant ownership before enabling RLS.

## Storage migration concerns

- Replace local file paths with bucket keys and signed URL generation.
- Keep `FileAsset` schema stable and switch only the storage adapter implementation.

## Deployment surface

- Supabase Auth
- Postgres
- Storage
- optional Edge Functions for notification fan-out or async automation workers

## Risks and sequencing

1. Move persistence to Postgres behind the repository seam.
2. Add auth adapter and membership mapping.
3. Introduce RLS after repository queries are fully tenant-keyed.
4. Migrate storage last and validate portal/file visibility with scoped tests.
