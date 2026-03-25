import assert from "node:assert/strict";

import { createFlow } from "../packages/mutaflow/dist/core/createFlow.js";
import { optimistic } from "../packages/mutaflow/dist/optimistic.js";
import { paths, tags } from "../packages/mutaflow/dist/next/index.js";

const tests = [
  {
    name: "createFlow keeps action config and marks the definition",
    run: async () => {
      const action = async (input) => ({ id: `post:${input.title}` });

      const flow = createFlow({
        action,
        optimistic: optimistic.insert({
          target: "posts:list",
          position: "start",
          item: (input) => ({
            id: `temp:${input.title}`,
            title: input.title,
            pending: true,
          }),
        }),
        invalidate: [{ kind: "tag", value: "posts.list" }],
        redirect: ({ result }) => `/posts/${result.id}`,
      });

      assert.equal(flow.kind, "mutaflow.flow");
      assert.equal(flow.config.action, action);
      assert.equal(flow.config.optimistic?.target, "posts:list");
      assert.deepEqual(flow.config.invalidate, [{ kind: "tag", value: "posts.list" }]);
      assert.equal(flow.config.redirect?.({ input: { title: "Hello" }, result: { id: "post:Hello" } }), "/posts/post:Hello");
    },
  },
  {
    name: "optimistic.insert adds an item at the start",
    run: async () => {
      const insert = optimistic.insert({
        target: "todos:list",
        position: "start",
        item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
      });

      const result = insert.apply?.([{ id: "1", title: "Existing" }], { title: "Ship Mutaflow" });

      assert.deepEqual(result, [
        { id: "temp:Ship Mutaflow", title: "Ship Mutaflow", pending: true },
        { id: "1", title: "Existing" },
      ]);
    },
  },
  {
    name: "optimistic.update, remove, and replace transform array resources",
    run: async () => {
      const items = [
        { id: "1", title: "First", completed: false },
        { id: "2", title: "Second", completed: false },
      ];

      const update = optimistic.update({
        target: "todos:list",
        match: (item, input) => item.id === input.id,
        update: (item) => ({ ...item, completed: true }),
      });

      const remove = optimistic.remove({
        target: "todos:list",
        match: (item, input) => item.id === input.id,
      });

      const replace = optimistic.replace({
        target: "todos:list",
        match: (item, input) => item.id === input.id,
        replace: (_, input) => ({ id: input.id, title: input.title, completed: true }),
      });

      assert.deepEqual(update.apply?.(items, { id: "2" }), [
        { id: "1", title: "First", completed: false },
        { id: "2", title: "Second", completed: true },
      ]);

      assert.deepEqual(remove.apply?.(items, { id: "1" }), [
        { id: "2", title: "Second", completed: false },
      ]);

      assert.deepEqual(replace.apply?.(items, { id: "1", title: "Updated" }), [
        { id: "1", title: "Updated", completed: true },
        { id: "2", title: "Second", completed: false },
      ]);
    },
  },
  {
    name: "tags builder creates dot-separated invalidation entries",
    run: async () => {
      assert.deepEqual(tags.posts.list(), {
        kind: "tag",
        value: "posts.list",
      });

      assert.deepEqual(tags.posts.byId(42), {
        kind: "tag",
        value: "posts.byId.42",
      });
    },
  },
  {
    name: "paths builder creates slash-separated invalidation entries",
    run: async () => {
      assert.deepEqual(paths.posts.list(), {
        kind: "path",
        value: "/posts/list",
      });

      assert.deepEqual(paths.dashboard.user("42", "settings"), {
        kind: "path",
        value: "/dashboard/user/42/settings",
      });
    },
  },
];

let failed = 0;

for (const testCase of tests) {
  try {
    await testCase.run();
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} test(s) failed.`);
} else {
  console.log(`\nAll ${tests.length} tests passed.`);
}
