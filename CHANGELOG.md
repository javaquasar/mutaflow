# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0

First public early-adopter release.

### Core Runtime

- Added `createFlow`, `runFlow`, and `useFlow` as the core mutation orchestration primitives.
- Added optimistic helpers for `insert`, `update`, `remove`, and `replace`.
- Added optimistic resource stores and mutation event stores.
- Added rollback, reconcile, retries, cancellation, flow ids, and concurrent mutation handling.
- Added lifecycle hooks and middleware: `beforeRun`, `afterSuccess`, `afterError`, `onSettled`, and `middleware`.

### Next Integrations

- Added `mutaflow/next` tag and path builders.
- Added typed invalidation registries via `createInvalidationRegistry`, `defineTags`, and `definePaths`.
- Added consistency presets for read-your-own-writes behavior.
- Added `mutaflow/next/server` helpers for `revalidateTag`, `updateTag`, and `revalidatePath` integration.
- Added `mutaflow/next-safe-action` helper API and adapters.

### Ecosystem Packages

- Added `@mutaflow/devtools` with summary cards, grouped flows, filters, consistency visibility, invalidation visibility, and event inspection.
- Added `@mutaflow/testkit` with flow recording, event/resource assertions, invalidation checks, consistency checks, and summary assertions.

### Examples And Docs

- Added a basic example documenting API direction.
- Added a full Next App Router example with real server actions.
- Brought README content closer to release-ready landing page quality.
- Added release and versioning guidance for first public publish.
