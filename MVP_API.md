# Mutaflow MVP API v0.1

## Design Goal

Mutaflow v0.1 should feel clearly different from next-safe-action.

It should not focus on defining actions safely.
It should focus on describing mutation flows around actions.

The core unit is not "safe action".
The core unit is "flow".

## API Shape

### Basic flow

```ts
import { createFlow } from "mutaflow";

export const createPostFlow = createFlow({
  action: createPost,
  optimistic: {
    target: "posts.list",
    apply: (posts, input) => [
      { id: `temp:${crypto.randomUUID()}`, title: input.title, pending: true },
      ...posts,
    ],
  },
  reconcile: {
    target: "posts.list",
    onSuccess: (posts, result) =>
      posts.map((post) =>
        post.id === result.tempId ? { ...result.post, pending: false } : post
      ),
  },
  invalidate: ["posts:list", "dashboard:stats"],
  redirect: ({ result }) => `/posts/${result.post.id}`,
});
```

### Using a flow in a client component

```ts
"use client";

import { useFlow } from "mutaflow/react";
import { createPostFlow } from "./flows";

export function NewPostButton() {
  const postFlow = useFlow(createPostFlow);

  return (
    <button
      disabled={postFlow.pending}
      onClick={() => postFlow.run({ title: "Hello" })}
    >
      Create
    </button>
  );
}
```

## Core Concepts

### createFlow

Defines the lifecycle of a mutation.

Responsibilities:
- connect action execution
- define optimistic behavior
- define reconciliation
- declare invalidation
- declare side effects

### useFlow

Client hook for running and observing a flow.

Returns:
- `run(input)`
- `pending`
- `error`
- `lastResult`
- `stage`
- `reset()`

### optimistic target

A named UI resource the optimistic patch applies to.

In v0.1 this can be explicit and simple:
- string keys
- adapter-backed local resources
- developer-provided state bridges

### reconcile

Describes how real server data replaces optimistic state.

This is one of the main API differences from next-safe-action:
Mutaflow should model reconciliation as a first-class step, not just optimistic state plus revalidation.

### invalidate

Declarative invalidation after success.

Supports:
- tags
- paths
- helper builders

Example:
```ts
invalidate: [
  tags.posts.list(),
  tags.posts.byId(id),
  paths.posts.list(),
]
```

## Proposed Minimal API

### 1. createFlow

```ts
type FlowConfig<TInput, TResult> = {
  action: (input: TInput) => Promise<TResult>;
  optimistic?: OptimisticConfig<TInput, TResult>;
  reconcile?: ReconcileConfig<TResult>;
  invalidate?: InvalidateEntry[] | ((ctx: SuccessCtx<TInput, TResult>) => InvalidateEntry[]);
  redirect?: string | ((ctx: SuccessCtx<TInput, TResult>) => string | void);
  onSuccess?: (ctx: SuccessCtx<TInput, TResult>) => void;
  onError?: (ctx: ErrorCtx<TInput>) => void;
};
```

### 2. useFlow

```ts
const flow = useFlow(createPostFlow);

flow.run(input);
flow.pending;
flow.stage; // idle | optimistic | running | success | error | rolled_back
flow.error;
flow.lastResult;
```

### 3. helpers for common optimistic cases

```ts
import { optimistic } from "mutaflow";

optimistic.insert(...)
optimistic.update(...)
optimistic.remove(...)
optimistic.replace(...)
```

### 4. invalidation helpers

```ts
import { tags, paths } from "mutaflow/next";

tags.posts.list()
tags.posts.byId(id)
paths.posts.list()
paths.dashboard.home()
```

## What Makes This Different

### Difference 1: flow-first, not action-first

next-safe-action centers action definition.
Mutaflow centers mutation lifecycle.

### Difference 2: reconciliation is first-class

Mutaflow should explicitly model:
- optimistic apply
- rollback
- reconcile real result

This is more than "run action and expose optimistic state".

### Difference 3: invalidation is part of the API

Instead of manually mixing revalidation logic into action bodies, the flow owns mutation aftermath.

### Difference 4: target-oriented optimistic updates

Mutaflow should operate on named resources or targets, not only on one local `currentState` prop.

That gives it room later for:
- list/detail synchronization
- cross-component optimistic updates
- devtools inspection

## Recommended v0.1 Scope

Ship only:
- `createFlow`
- `useFlow`
- optimistic helpers: `insert`, `update`, `remove`
- invalidate helpers for Next.js tags and paths
- basic rollback
- basic reconciliation
- tiny dev logger

Do not ship yet:
- offline support
- retry queue
- conflict resolution engine
- full devtools UI
- form abstraction layer
- global normalized cache

## Example v0.1 API

```ts
export const createTodoFlow = createFlow({
  action: createTodo,
  optimistic: optimistic.insert({
    target: "todos:list",
    item: (input) => ({
      id: `temp:${crypto.randomUUID()}`,
      title: input.title,
      completed: false,
      pending: true,
    }),
  }),
  reconcile: {
    target: "todos:list",
    match: (item, result) => item.id === result.tempId,
    replace: (item, result) => result.todo,
  },
  invalidate: ({ result }) => [
    tags.todos.list(),
    tags.todos.byId(result.todo.id),
  ],
});
```

## v0.1 One-Line Promise

Mutaflow lets developers describe a full mutation lifecycle in one place, instead of stitching together React primitives, action wrappers, and Next.js cache APIs by hand.
