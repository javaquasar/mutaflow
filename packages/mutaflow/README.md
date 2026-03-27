# mutaflow

[![CI](https://github.com/javaquasar/mutaflow/actions/workflows/ci.yml/badge.svg)](https://github.com/javaquasar/mutaflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Mutation orchestration for Next.js Server Actions.

Mutaflow helps with the layer after an action already exists:
- optimistic UI
- rollback and reconcile
- invalidation and consistency
- mutation lifecycle hooks and middleware
- Next cache integration

## Install

```bash
npm install mutaflow
```

## Quick Start

```ts
import { createFlow, optimistic } from "mutaflow";
import { consistency, createInvalidationRegistry, definePaths, defineTags } from "mutaflow/next";

const registry = createInvalidationRegistry({
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

const createPostFlow = createFlow({
  action: createPost,
  optimistic: optimistic.insert({
    target: "posts:list",
    item: (input) => ({
      id: `temp:${input.title}`,
      title: input.title,
      pending: true,
    }),
  }),
  consistency: ({ result }) =>
    consistency.immediate({
      tags: [registry.tags.posts.list(), registry.tags.posts.byId(result.id)],
      paths: [registry.paths.posts.byId(result.id)],
    }),
});
```

## Why Mutaflow

Mutaflow is aimed at teams that like Server Actions but do not want mutation logic to dissolve into ad hoc glue code.

It gives one place to describe:
- optimistic apply
- rollback
- reconcile
- invalidation
- consistency policy
- retries and cancellation
- lifecycle hooks

## Visuals

### Devtools Overview

![Mutaflow Devtools Overview](https://raw.githubusercontent.com/javaquasar/mutaflow/main/docs/assets/devtools-overview.svg)

### Devtools Inspector

![Mutaflow Devtools Inspector](https://raw.githubusercontent.com/javaquasar/mutaflow/main/docs/assets/devtools-inspector.svg)

## Comparison

### Mutaflow vs `next-safe-action`

`next-safe-action` helps define and invoke safe actions.

Mutaflow helps orchestrate the mutation lifecycle after the action exists.

Use Mutaflow when you need:
- optimistic mutations
- rollback and reconcile
- invalidation and consistency
- lifecycle hooks
- mutation devtools
- mutation test helpers

### Mutaflow vs Handwritten Server Action Glue

Handwritten glue gives total freedom, but usually spreads mutation behavior across multiple places.

Mutaflow centralizes that behavior in flow definitions and gives you a more inspectable system.

## Key Surfaces

- `mutaflow`
- `mutaflow/react`
- `mutaflow/next`
- `mutaflow/next/server`
- `mutaflow/next-safe-action`

## Ecosystem

- `@mutaflow/devtools`
- `@mutaflow/testkit`

## Examples

- consumer demo: [examples/published-next-app/README.md](https://github.com/javaquasar/mutaflow/blob/main/examples/published-next-app/README.md)
- concepts guide: [docs/CONCEPTS.md](https://github.com/javaquasar/mutaflow/blob/main/docs/CONCEPTS.md)

## Status

`v0.1.2` continues the early-adopter release line with clearer docs and a published-package consumer demo.
