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
- [tests](tests): node-based smoke tests for the current scaffold
- [examples/basic/README.md](examples/basic/README.md): usage direction example
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

## Working Locally

```powershell
npm install
npm run typecheck
npm run build
npm run test
```

## Basic Direction

The intended shape now looks like this:

```ts
const store = createResourceStore({
  "todos:list": [],
});

const events = createMutationEventStore();

const flow = createFlow({
  action: createTodo,
  optimistic: optimistic.insert({
    target: "todos:list",
    item: (input) => ({
      id: `temp:${input.title}`,
      title: input.title,
      pending: true,
    }),
  }),
  reconcile: {
    target: "todos:list",
    onSuccess: (current, result) =>
      (Array.isArray(current) ? current : []).map((todo) =>
        todo.id.startsWith("temp:") ? { ...todo, id: result.id, pending: false } : todo,
      ),
  },
});

const mutation = useFlow(flow, { store, events, retries: 1 });
const todos = useResource("todos:list", store) ?? [];
const mutationEvents = useMutationEvents(events);
const flowState = useFlowState(events, "createTodo");
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
