# Basic Example

This example shows the intended ergonomic direction for Mutaflow using real files in this folder.

## Files

- [src/createTodoFlow.ts](src/createTodoFlow.ts): flow definition
- [src/store.ts](src/store.ts): optimistic resource registry and mutation event stores
- [src/CreateTodoButton.tsx](src/CreateTodoButton.tsx): client-side trigger with `useFlow`, `useResource`, `useFlowState`, and `useMutationEvents`
- [src/App.tsx](src/App.tsx): tiny app shell

## What It Demonstrates

- a `createFlow(...)` definition around a server-like action
- `createResourceStore(...)` with a real `todos:list` target
- `createMutationEventStore(...)` as the base for future devtools
- `optimistic.insert(...)` for list-first optimistic behavior
- `reconcile.onSuccess(...)` replacing the optimistic resource after success
- `useResource(...)` for reading resource state from the store in React
- `useFlow(...)` for pending state and mutation execution
- `useFlowState(...)` for reading the latest flow stage from the event stream
- `useMutationEvents(...)` for observing the mutation timeline in React
- `tags.todos.list()` and `tags.todos.byId(...)` invalidation metadata

This example is intentionally small and framework-light.
It exists to document the desired API direction, not to be a full runnable app yet.
