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

## Consistency Presets

`mutaflow/next` now provides strategy presets for read-your-own-writes behavior:

```ts
import { consistency } from "mutaflow/next";

const preset = consistency.immediate({
  tags: [postInvalidation.tags.posts.list()],
  paths: [postInvalidation.paths.posts.byId(id)],
});
```

## Typed Invalidation Registry

`mutaflow/next` can now define reusable invalidation registries:

```ts
import {
  createInvalidationRegistry,
  definePaths,
  defineTags,
} from "mutaflow/next";

const postInvalidation = createInvalidationRegistry({
  tags: defineTags((tags) => ({
    posts: {
      list: () => tags.posts.list(),
      byId: (id: string) => tags.posts.byId(id),
    },
  })),
  paths: definePaths((paths) => ({
    posts: {
      byId: (id: string) => paths.posts.byId(id),
    },
  })),
});
```

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



