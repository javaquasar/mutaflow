# Basic Example

This example shows the intended ergonomic direction for Mutaflow using real files in this folder.

## Files

- [src/createTodoFlow.ts](src/createTodoFlow.ts): flow definition
- [src/CreateTodoButton.tsx](src/CreateTodoButton.tsx): client-side trigger with `useFlow`
- [src/App.tsx](src/App.tsx): tiny app shell

## What It Demonstrates

- a `createFlow(...)` definition around a server-like action
- `optimistic.insert(...)` for list-first optimistic behavior
- `tags.todos.list()` and `tags.todos.byId(...)` invalidation metadata
- `useFlow(...)` for pending state and mutation execution

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
  invalidate: ({ result }) => [
    tags.todos.list(),
    tags.todos.byId(result.id),
  ],
  redirect: ({ result }) => `/todos/${result.id}`,
});
```

This example is intentionally small and framework-light.
It exists to document the desired API direction, not to be a full runnable app yet.
