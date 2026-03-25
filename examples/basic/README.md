# Basic Example

This example shows the intended ergonomic direction for Mutaflow using real files in this folder.

## Files

- [src/createTodoFlow.ts](src/createTodoFlow.ts): flow definition
- [src/store.ts](src/store.ts): optimistic resource registry setup
- [src/CreateTodoButton.tsx](src/CreateTodoButton.tsx): client-side trigger with `useFlow` and `useResource`
- [src/App.tsx](src/App.tsx): tiny app shell

## What It Demonstrates

- a `createFlow(...)` definition around a server-like action
- `createResourceStore(...)` with a real `todos:list` target
- `optimistic.insert(...)` for list-first optimistic behavior
- `reconcile.onSuccess(...)` replacing the optimistic resource after success
- `useResource(...)` for reading resource state from the store in React
- `useFlow(...)` for pending state and mutation execution
- `tags.todos.list()` and `tags.todos.byId(...)` invalidation metadata

## Example Flow

```ts
export const createTodoFlow = createFlow({
  action: createTodo,
  optimistic: optimistic.insert<CreateTodoInput, Todo>({
    target: "todos:list",
    position: "start",
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
```

## Example Read Path

```ts
const todos = useResource<Todo[]>("todos:list", store) ?? [];
```

This example is intentionally small and framework-light.
It exists to document the desired API direction, not to be a full runnable app yet.
