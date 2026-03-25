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

## Exports

- `mutaflow`
- `mutaflow/react`
- `mutaflow/next`

## Status

This is an early v0.1 scaffold, not a production-ready release yet.
