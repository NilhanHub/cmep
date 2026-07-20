# Local to Firebase

## Stable seams

These boundaries stay stable:
- UI routes and module boundaries
- tenant and role model
- repository interfaces and tenant-scoped mutations
- AI provider interface
- notification, storage, and auth adapter seams

## Adapters that change

- auth adapter: local cookie persona -> Firebase Auth session
- persistence adapter: Prisma/SQLite repositories -> Firestore repositories
- file storage adapter: local filesystem/public paths -> Firebase Storage
- notifications adapter: local notifications table -> Cloud Functions or in-app Firestore-backed notifications

## Auth migration steps

1. Introduce a Firebase auth adapter alongside the local adapter.
2. Map Firebase uid -> `User` -> `Membership`.
3. Preserve role and tenant switching in admin/dev mode, remove impersonation from production.
4. Add Google Auth provider later through the same adapter seam.

## Data migration concerns

- Firestore document layout should preserve direct tenant ownership on every entity.
- Timeline and activity records should remain append-friendly.
- Lifecycle templates and automation rules should be versioned documents per tenant.
- Existing SQLite ids can be preserved as Firestore document ids to simplify migration.

## Storage migration concerns

- `FileAsset.path` should become a storage reference plus signed URL resolver.
- Keep mutable uploads behind the storage adapter so UI code does not change.

## Deployment surface

- Firebase Hosting for web surface
- Firebase Auth for sign-in
- Firestore for data
- Storage for files
- optional Cloud Functions for notifications and automation fan-out

## Risks and sequencing

1. Migrate auth adapter first in dual-mode.
2. Move low-risk read surfaces to Firestore repositories.
3. Migrate write paths with tenant-scope tests intact.
4. Move files last after data references are stable.
