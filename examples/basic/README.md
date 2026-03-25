# Basic Example

This example shows the intended ergonomic direction for Mutaflow using real files in this folder.

## Files

- [src/createTodoFlow.ts](src/createTodoFlow.ts): flow definition using `createServerActionAdapter(...)`
- [src/createTodoSafeActionFlow.ts](src/createTodoSafeActionFlow.ts): flow definition using `createNextSafeActionFlow(...)`
- [src/testCreateTodoSafeFlow.ts](src/testCreateTodoSafeFlow.ts): small `@mutaflow/testkit` example for flow assertions
- [src/store.ts](src/store.ts): optimistic resource registry and mutation event stores
- [src/CreateTodoButton.tsx](src/CreateTodoButton.tsx): client-side trigger with `useFlow`, `useResource`, `useFlowState`, and `useMutationEvents`
- [src/MutationDebugPanel.tsx](src/MutationDebugPanel.tsx): prototype devtools timeline and inspector
- [src/App.tsx](src/App.tsx): tiny app shell

## What It Demonstrates

- a `createFlow(...)` definition around a Next-oriented action adapter
- `createServerActionAdapter(...)` for wrapping plain server actions
- `createNextSafeActionFlow(...)` for a shorter `next-safe-action` setup
- `@mutaflow/testkit` for flow assertions and event/resource checks
- flow `meta`, `middleware`, `beforeRun`, `afterSuccess`, `afterError`, and `onSettled`
- `createResourceStore(...)` with a real `todos:list` target
- `createMutationEventStore(...)` as the base for future devtools
- `optimistic.insert(...)` for list-first optimistic behavior
- `reconcile.onSuccess(...)` replacing the optimistic resource after success
- `useResource(...)` for reading resource state from the store in React
- `useFlow(...)` for pending state, retries, cancellation, and mutation execution
- `useFlowState(...)` for reading the latest flow stage from the event stream
- `useMutationEvents(...)` for observing the mutation timeline in React
- `@mutaflow/devtools` timeline and event inspector components
- `tags.todos.list()` and `tags.todos.byId(...)` invalidation metadata
- `isNextSafeActionError(...)` and `getNextSafeActionErrorKind(...)` for error handling

## next-safe-action helper API

If you already use `next-safe-action`, the helper layer removes one wrapper level:

```ts
import { optimistic } from "mutaflow";
import { createNextSafeActionFlow } from "mutaflow/next-safe-action";

const createTodoFlow = createNextSafeActionFlow({
  action: createTodoAction,
  optimistic: optimistic.insert({
    target: "todos:list",
    item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
  }),
});
```

## testkit example

The test example in [src/testCreateTodoSafeFlow.ts](src/testCreateTodoSafeFlow.ts) shows the intended shape for testing optimistic flows:

```ts
import { createTestStore, expectEvents, expectReconciled, runFlowAndCollectEvents } from "@mutaflow/testkit";
```

This example is intentionally small and framework-light.
It exists to document the desired API direction, not to be a full runnable app yet.

