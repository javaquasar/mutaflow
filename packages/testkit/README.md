# @mutaflow/testkit

Testing helpers for Mutaflow optimistic flows.

## Install

```bash
npm install mutaflow @mutaflow/testkit
```

## What it provides

- `createTestStore(...)`
- `runFlowAndCollectEvents(...)`
- `recordFlow(...)`
- `expectEvents(...)`
- `expectResource(...)`
- `expectInvalidations(...)`
- `expectConsistency(...)`
- `expectSummary(...)`
- `expectOptimisticState(...)`
- `expectRollback(...)`
- `expectReconciled(...)`

## Example

```ts
import { optimistic } from "mutaflow";
import { createFlow } from "mutaflow";
import {
  createTestStore,
  expectConsistency,
  expectEvents,
  expectReconciled,
  runFlowAndCollectEvents,
} from "@mutaflow/testkit";

const flow = createFlow({
  action: async (input) => ({ id: `todo:${input.title}`, title: input.title }),
  optimistic: optimistic.insert({
    target: "todos:list",
    item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
  }),
  consistency: () => ({
    strategy: "immediate",
    readYourOwnWrites: true,
    invalidations: [{ kind: "tag", value: "todos.list" }],
  }),
  reconcile: {
    target: "todos:list",
    onSuccess: (current, result) =>
      (Array.isArray(current) ? current : []).map((todo) =>
        todo.id === `temp:${result.title}`
          ? { ...todo, id: result.id, pending: false }
          : todo,
      ),
  },
});

const testStore = createTestStore({
  "todos:list": [],
});

const run = await runFlowAndCollectEvents(flow, { title: "Ship" }, testStore);

expectEvents(run, ["flow:start", "flow:optimistic-applied", "flow:reconciled", "flow:success"]);
expectConsistency(run, { strategy: "immediate", readYourOwnWrites: true });
expectReconciled(run, "todos:list", [
  { id: "todo:Ship", title: "Ship", pending: false },
]);
```

## Status

This is an early test helper package for the current Mutaflow runtime.
