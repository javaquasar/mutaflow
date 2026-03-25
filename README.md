# Mutaflow

Mutaflow is a mutation orchestration library for Next.js Server Actions.

The repository uses a small monorepo layout on purpose. Today it contains one publishable package and one prototype tooling package, but the structure is designed to support the future Mutaflow ecosystem without a painful repo migration later.

## Why `packages/`

`packages/` is intentional.

Mutaflow is starting as one library, but the product direction naturally expands into adjacent tooling:
- devtools for mutation lifecycle inspection
- test utilities for optimistic flows
- framework adapters and integration helpers
- example and playground support packages
- linting or conventions packages for flow design

Keeping publishable packages in `packages/` makes it easier to grow into a small ecosystem while keeping examples, docs, CI, and future packages in one repository.

## Repository Layout

- [packages/mutaflow](packages/mutaflow): the main publishable npm package
- [packages/devtools](packages/devtools): prototype timeline and event inspector package
- [examples/basic/README.md](examples/basic/README.md): small API direction example
- [examples/next-app/README.md](examples/next-app/README.md): full Next App Router example with server actions and devtools
- [tests](tests): node-based smoke tests for the current scaffold
- [POSITIONING.md](POSITIONING.md): positioning and market framing
- [MVP_API.md](MVP_API.md): MVP API direction
- [ECOSYSTEM_ROADMAP.md](ECOSYSTEM_ROADMAP.md): future package roadmap
- [CONTRIBUTING.md](CONTRIBUTING.md): contribution guide
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): community expectations
- [CHANGELOG.md](CHANGELOG.md): project history
- [RELEASING.md](RELEASING.md): release checklist

## Current Scope

Today the scaffold includes:
- `createFlow`
- `createResourceStore`
- `createMutationEventStore`
- `runFlow`
- `useFlow`
- `useResource`
- `useFlowState`
- `useMutationEvents`
- `createServerActionAdapter`
- `createNextSafeActionAdapter`
- `optimistic.insert/update/remove/replace`
- `mutaflow/next` tag and path builders
- `@mutaflow/devtools` timeline and inspector prototype

The core runtime can now:
- register resource targets
- read and write shared resource state
- apply optimistic patches
- roll back on failure
- reconcile on success
- emit mutation lifecycle events
- retry failed mutations
- cancel in-flight mutations
- track multiple concurrent mutations with flow ids
- orchestrate plain server actions and next-safe-action-style clients through adapters

## Examples

If you want the fastest orientation path:
- start with [examples/basic/README.md](examples/basic/README.md)
- then move to [examples/next-app/README.md](examples/next-app/README.md)

The Next example shows:
- App Router layout
- real server actions
- optimistic client store hydration
- `createServerActionAdapter(...)`
- `@mutaflow/devtools` in a real page

## Adapter Direction

Mutaflow treats the mutation workflow as the main concern and the action source as an adapter.

Today the first helpers are:
- `createServerActionAdapter(action)`
- `createNextSafeActionAdapter(action)`

That means the same `createFlow(...)` API can sit on top of:
- plain async server actions
- Next.js-oriented server action functions
- `next-safe-action` style clients returning `{ data, validationErrors, serverError }`

## Basic Direction

The intended shape now looks like this:

```ts
const flow = createFlow({
  action: createServerActionAdapter(createTodo),
  optimistic: optimistic.insert({
    target: "todos:list",
    item: (input) => ({
      id: `temp:${input.title}`,
      title: input.title,
      pending: true,
    }),
  }),
});
```

## Working Locally

```powershell
npm install
npm run typecheck
npm run build
npm run test
```

## Troubleshooting

If TypeScript build artifacts ever appear inside `packages/*/src`, you can remove only those generated files with:

```powershell
Get-ChildItem packages -Recurse -Include *.js,*.js.map,*.d.ts,*.d.ts.map | Where-Object { $_.FullName -like '*\src\*' } | Remove-Item -Force
```

## Publishing Direction

Current packages intended for publication:
- [packages/mutaflow](packages/mutaflow)
- [packages/devtools](packages/devtools)

Typical publish flow:

```powershell
npm run build
npm publish --workspace mutaflow
npm publish --workspace @mutaflow/devtools
```

GitHub Actions workflows live in [.github/workflows](.github/workflows).

## Ecosystem Direction

The likely package evolution looks like this:
- `mutaflow`: the main runtime and public API
- `@mutaflow/devtools`: lifecycle inspection and debugging
- `@mutaflow/example-utils`: shared example helpers and demo fixtures
- `@mutaflow/eslint-config`: linting presets and conventions for flow definitions

More detail lives in [ECOSYSTEM_ROADMAP.md](ECOSYSTEM_ROADMAP.md).
