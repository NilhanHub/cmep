# Rehydration Truth Contract

## Startup truth source

The startup truth source is the local SQLite database accessed through Prisma repositories. Repo-local seed data defines the initial durable state on reset, including the offering/catalog spine.

## Local DB authority

SQLite is the write authority for business entities. That includes:

- offerings
- variants
- prices
- catalogs
- catalog assignments
- customer-offering links
- workflow records that reference those entities

Cookies carry only identity and view context. Client caches are projections and can be discarded.

## Client hydration sequence

1. Server resolves tenant and role context from local auth cookies.
2. Server queries tenant-scoped repositories from SQLite.
3. Pages render from server-fetched data, including catalog and customer-offering state.
4. Client components hydrate around server truth and use route handlers for mutation.
5. Successful mutations refresh server state and re-render from DB authority.

## Stale async guard behavior

Mutations validate current tenant context and target ownership before writes. Late or stale client responses are ignored if the page context changed. Cross-tenant or cross-client requests fail even when the client attempts to reuse stale ids.

## Saved semantics

"Saved" means the mutation committed in SQLite and any derived automation, activity, customer-offering, or catalog side effects were written successfully.

## Error recovery

Validation failures return structured field errors. Unexpected write failures surface a toast or inline error and leave prior durable state untouched. Form defaults that intentionally represent “no value” must normalize blank submissions before validation.

## Identity and tenant precedence

Tenant membership resolved from the local auth adapter outranks any client-provided tenant identifier. All server mutations re-check tenant ownership on write. Portal mutations re-check portal scope before touching conversations, quotes, or catalog-visible records.

## Future remote sync assumptions

Remote backends must preserve:

- tenant scope
- idempotent writes
- last-writer policy per entity
- price-version history instead of in-place rewrite
- the rule that server truth outranks stale client state
- the offering/catalog spine as the same canonical contract that local SQLite uses today
