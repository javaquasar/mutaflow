# Mutaflow Ecosystem Roadmap

This document describes the likely package evolution for the Mutaflow ecosystem.

The goal is not to ship many packages early. The goal is to keep the repository structure aligned with the product direction so growth stays clean when the main library matures.

## Principles

- Keep the core package small and clear.
- Split packages only when they unlock a distinct workflow or audience.
- Avoid ecosystem sprawl before the main package proves demand.
- Prefer packages with a clear installation reason and a clear README promise.

## Package Strategy

### 1. `mutaflow`

This remains the main package and the center of the ecosystem.

Responsibilities:
- `createFlow`
- `useFlow`
- optimistic helpers
- mutation lifecycle primitives
- framework-facing public API that most users install first

This package should stay focused and relatively lightweight.

### 2. `@mutaflow/devtools`

Purpose:
- visualize mutation lifecycle events
- inspect optimistic patches
- inspect invalidation metadata
- show success, rollback, and error transitions

Why it deserves its own package:
- not every application needs it in production
- devtools usually have a different release cadence
- keeps the main package lighter

Good v1 scope:
- event logger panel
- mutation timeline
- basic flow inspection hooks

## 3. `@mutaflow/testkit`

Purpose:
- testing helpers for flows
- event and resource assertions
- optimistic apply, rollback, and reconcile checks
- reduce repeated boilerplate in mutation tests

Why it deserves its own package:
- teams need reliable mutation tests even if they do not ship devtools
- testing code should stay out of the production runtime package
- gives Mutaflow a stronger reliability story, not just a runtime story

Good v1 scope:
- `createTestStore(...)`
- `runFlowAndCollectEvents(...)`
- `expectEvents(...)`
- `expectResource(...)`
- `expectOptimisticState(...)`
- `expectRollback(...)`
- `expectReconciled(...)`

## 4. `@mutaflow/example-utils`

Purpose:
- shared helpers for examples and demos
- fake stores, temp ID generators, demo fixtures, sample adapters
- reduce duplication across example apps and documentation sandboxes

Why it deserves its own package:
- examples often need helper code that should not leak into the main runtime
- keeps docs and demos consistent
- can later support starter templates

Good v1 scope:
- demo fixtures
- reusable fake action adapters
- small helper utilities used in examples

## 5. `@mutaflow/eslint-config`

Purpose:
- opinionated lint rules and presets for Mutaflow projects
- enforce conventions around flow files and explicit mutation behavior

Why it deserves its own package:
- different audience from runtime consumers
- helps teams adopt consistent patterns across codebases

Possible future rules:
- discourage hidden side effects in flow definitions
- enforce naming conventions for flows
- enforce explicit invalidation declarations where required

## 6. Potential Future Packages

These are possible, but they should only exist if the need becomes real.

### `@mutaflow/next-devtools`

Purpose:
- Next.js-specific debugging helpers
- cache tag and path invalidation inspection

### `@mutaflow/react-inspector`

Purpose:
- React-side visualization primitives for embedding flow status in internal tooling

### `@mutaflow/create-app`

Purpose:
- scaffold starter projects and examples once the public API stabilizes

## Suggested Release Order

1. `mutaflow`
2. `@mutaflow/devtools`
3. `@mutaflow/testkit`
4. `@mutaflow/example-utils`
5. `@mutaflow/eslint-config`

## What Not To Do Early

Avoid publishing many packages before the core runtime proves value.

Do not split packages just because the repository already supports it.
A new package should only exist when it gives users a clearly separate reason to install it.

## Practical Meaning For This Repo

The current `packages/` layout is a bet on future clarity, not current complexity.

Today there are three real packages:
- [packages/mutaflow](packages/mutaflow)
- [packages/devtools](packages/devtools)
- [packages/testkit](packages/testkit)

Later, if the ecosystem grows, new packages can be added alongside them without restructuring the entire repository.
