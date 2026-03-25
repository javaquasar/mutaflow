# Mutaflow

Mutaflow is a mutation orchestration library for Next.js Server Actions.

The repository uses a small monorepo layout on purpose. Today it contains one publishable package, but the structure is designed to support the future Mutaflow ecosystem without a painful repo migration later.

## Why `packages/`

`packages/` is intentional.

Mutaflow is starting as one library, but the product direction naturally expands into adjacent tooling:
- devtools for mutation lifecycle inspection
- test utilities for optimistic flows
- framework adapters and integration helpers
- example and playground support packages
- linting or conventions packages for flow design

Keeping the publishable package in `packages/mutaflow` makes it easier to grow into a small ecosystem while keeping examples, docs, CI, and future packages in one repository.

## Repository Layout

- [packages/mutaflow](packages/mutaflow): the main publishable npm package
- [examples/basic/README.md](examples/basic/README.md): usage direction example
- [POSITIONING.md](POSITIONING.md): positioning and market framing
- [MVP_API.md](MVP_API.md): MVP API direction
- [ECOSYSTEM_ROADMAP.md](ECOSYSTEM_ROADMAP.md): future package roadmap
- [CONTRIBUTING.md](CONTRIBUTING.md): contribution guide
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): community expectations
- [CHANGELOG.md](CHANGELOG.md): project history
- [RELEASING.md](RELEASING.md): release checklist

## Current Scope

The current codebase focuses on the core package only.

Today the scaffold includes:
- `createFlow`
- `useFlow`
- `optimistic.insert/update/remove/replace`
- `mutaflow/next` tag and path builders

The next big step is connecting these declarations to a real optimistic target store.

## Working Locally

```powershell
npm install
npm run typecheck
npm run build
```

## Publishing Direction

The package intended for publication today is [packages/mutaflow](packages/mutaflow).

Typical publish flow:

```powershell
npm run build
npm publish --workspace mutaflow
```

GitHub Actions workflows live in [.github/workflows](.github/workflows).

## Ecosystem Direction

The likely package evolution looks like this:
- `mutaflow`: the main runtime and public API
- `@mutaflow/devtools`: lifecycle inspection and debugging
- `@mutaflow/example-utils`: shared example helpers and demo fixtures
- `@mutaflow/eslint-config`: linting presets and conventions for flow definitions

More detail lives in [ECOSYSTEM_ROADMAP.md](ECOSYSTEM_ROADMAP.md).
