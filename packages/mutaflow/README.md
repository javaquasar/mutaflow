# mutaflow

Mutaflow is a mutation orchestration library for Next.js Server Actions.

It focuses on the layer after an action is already callable:
- optimistic updates
- rollback
- reconciliation
- invalidation metadata
- redirect metadata
- mutation lifecycle state

## Install

```bash
npm install mutaflow
```

## Current API Scaffold

```ts
import { createFlow, optimistic } from "mutaflow";
import { useFlow } from "mutaflow/react";
import { tags } from "mutaflow/next";

const createPostFlow = createFlow({
  action: createPost,
  optimistic: optimistic.insert({
    target: "posts:list",
    item: (input) => ({
      id: `temp:${crypto.randomUUID()}`,
      title: input.title,
      pending: true,
    }),
    position: "start",
  }),
  invalidate: ({ result }) => [
    tags.posts.list(),
    tags.posts.byId(result.id),
  ],
});

function CreatePostButton() {
  const flow = useFlow(createPostFlow);

  return (
    <button disabled={flow.pending} onClick={() => flow.run({ title: "Hello" })}>
      Create
    </button>
  );
}
```

## next-safe-action helper API

If you use `next-safe-action`, Mutaflow now exposes a dedicated helper layer:

```ts
import { optimistic } from "mutaflow";
import { createNextSafeActionFlow } from "mutaflow/next-safe-action";

const createPostFlow = createNextSafeActionFlow({
  action: createPostAction,
  optimistic: optimistic.insert({
    target: "posts:list",
    item: (input) => ({
      id: `temp:${input.title}`,
      title: input.title,
      pending: true,
    }),
  }),
});
```

You can also use:
- `nextSafeAction(action)`
- `createNextSafeActionAdapter(action)`
- `isNextSafeActionError(error)`
- `getNextSafeActionErrorKind(error)`
- `unwrapNextSafeActionResult(result)`

## Lifecycle Hooks and Middleware

Flows can now carry shared `meta` and hook into the full mutation lifecycle:
- `beforeRun`
- `afterSuccess`
- `afterError`
- `onSettled`
- `middleware`

```ts
const createPostFlow = createFlow({
  action: createPost,
  meta: { feature: "posts" },
  middleware: [
    async (context, next) => {
      const result = await next();
      return result;
    },
  ],
  afterSuccess: ({ result }) => {
    console.log(result.id);
  },
});
```

## Exports

- `mutaflow`
- `mutaflow/react`
- `mutaflow/next`
- `mutaflow/next-safe-action`

## Status

This is an early v0.1 scaffold, not a production-ready release yet.

