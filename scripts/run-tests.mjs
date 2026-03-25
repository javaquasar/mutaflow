import assert from "node:assert/strict";

import { JSDOM } from "jsdom";
import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { createFlow } from "../packages/mutaflow/dist/core/createFlow.js";
import { createMutationEventStore } from "../packages/mutaflow/dist/core/events.js";
import { runFlow } from "../packages/mutaflow/dist/core/runFlow.js";
import { createResourceStore } from "../packages/mutaflow/dist/core/store.js";
import { optimistic } from "../packages/mutaflow/dist/optimistic.js";
import { paths, tags } from "../packages/mutaflow/dist/next/index.js";
import { useFlow } from "../packages/mutaflow/dist/react/useFlow.js";
import { useFlowState } from "../packages/mutaflow/dist/react/useFlowState.js";
import { useMutationEvents } from "../packages/mutaflow/dist/react/useMutationEvents.js";
import { useResource } from "../packages/mutaflow/dist/react/useResource.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function createDeferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function renderWithRoot(Component) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component));
    await flush();
  });

  return {
    container,
    root,
    cleanup: async () => {
      await act(async () => {
        root.unmount();
        await flush();
      });
      container.remove();
    },
  };
}

const tests = [
  {
    name: "resource store supports register, get, set, update, subscribe, and snapshot",
    run: async () => {
      const store = createResourceStore();
      let notifications = 0;

      store.register("todos:list", []);
      const unsubscribe = store.subscribe("todos:list", () => {
        notifications += 1;
      });

      assert.equal(store.has("todos:list"), true);
      assert.deepEqual(store.get("todos:list"), []);

      store.set("todos:list", [{ id: "1", title: "First" }]);
      store.update("todos:list", (current) => [
        ...(Array.isArray(current) ? current : []),
        { id: "2", title: "Second" },
      ]);

      assert.deepEqual(store.get("todos:list"), [
        { id: "1", title: "First" },
        { id: "2", title: "Second" },
      ]);
      assert.deepEqual(store.snapshot(), {
        "todos:list": [
          { id: "1", title: "First" },
          { id: "2", title: "Second" },
        ],
      });
      assert.equal(notifications, 2);

      unsubscribe();
      store.set("todos:list", []);
      assert.equal(notifications, 2);
    },
  },
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
    name: "runFlow applies optimistic patch and reconciles on success",
    run: async () => {
      const store = createResourceStore({
        "todos:list": [{ id: "1", title: "Existing", pending: false }],
      });

      const flow = createFlow({
        action: async (input) => ({ id: `todo:${input.title}` }),
        optimistic: optimistic.insert({
          target: "todos:list",
          position: "start",
          item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
        }),
        reconcile: {
          target: "todos:list",
          onSuccess: (current, result) =>
            (Array.isArray(current) ? current : []).map((todo) =>
              todo.id === "temp:Ship Mutaflow"
                ? { ...todo, id: result.id, pending: false }
                : todo,
            ),
        },
      });

      const pendingPromise = runFlow(flow, { title: "Ship Mutaflow" }, { store });

      assert.deepEqual(store.get("todos:list"), [
        { id: "temp:Ship Mutaflow", title: "Ship Mutaflow", pending: true },
        { id: "1", title: "Existing", pending: false },
      ]);

      const result = await pendingPromise;

      assert.equal(result.data?.id, "todo:Ship Mutaflow");
      assert.equal(result.optimisticTarget, "todos:list");
      assert.deepEqual(store.get("todos:list"), [
        { id: "todo:Ship Mutaflow", title: "Ship Mutaflow", pending: false },
        { id: "1", title: "Existing", pending: false },
      ]);
    },
  },
  {
    name: "runFlow emits events and rolls back optimistic state on error",
    run: async () => {
      const store = createResourceStore({
        "todos:list": [{ id: "1", title: "Existing", pending: false }],
      });
      const events = createMutationEventStore();

      const flow = createFlow({
        action: async function createTodo() {
          throw new Error("boom");
        },
        optimistic: optimistic.insert({
          target: "todos:list",
          position: "start",
          item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
        }),
      });

      const pendingPromise = runFlow(flow, { title: "Broken" }, { store, events });
      const result = await pendingPromise;

      assert.equal(result.error instanceof Error, true);
      assert.deepEqual(store.get("todos:list"), [
        { id: "1", title: "Existing", pending: false },
      ]);
      assert.deepEqual(events.getEvents().map((event) => event.type), [
        "flow:start",
        "flow:optimistic-applied",
        "flow:rolled-back",
        "flow:error",
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
  {
    name: "useResource reacts to store changes in React",
    run: async () => {
      const store = createResourceStore({
        "todos:list": [{ id: "1", title: "First", pending: false }],
      });

      function Component() {
        const todos = useResource("todos:list", store) ?? [];
        return React.createElement("div", { "data-count": String(todos.length) }, todos.map((todo) => todo.title).join(","));
      }

      const rendered = await renderWithRoot(Component);
      try {
        assert.equal(rendered.container.firstChild?.getAttribute("data-count"), "1");
        assert.equal(rendered.container.textContent, "First");

        await act(async () => {
          store.set("todos:list", [
            { id: "1", title: "First", pending: false },
            { id: "2", title: "Second", pending: true },
          ]);
          await flush();
        });

        assert.equal(rendered.container.firstChild?.getAttribute("data-count"), "2");
        assert.equal(rendered.container.textContent, "First,Second");
      } finally {
        await rendered.cleanup();
      }
    },
  },
  {
    name: "useFlow, useFlowState, and useMutationEvents reflect mutation lifecycle in React",
    run: async () => {
      const store = createResourceStore({
        "todos:list": [],
      });
      const events = createMutationEventStore();
      const deferred = createDeferred();

      const flow = createFlow({
        action: async function createTodo(input) {
          const result = await deferred.promise;
          return { id: result.id, title: input.title };
        },
        optimistic: optimistic.insert({
          target: "todos:list",
          position: "start",
          item: (input) => ({ id: `temp:${input.title}`, title: input.title, pending: true }),
        }),
        reconcile: {
          target: "todos:list",
          onSuccess: (current, result) =>
            (Array.isArray(current) ? current : []).map((todo) =>
              todo.id === "temp:Ship Mutaflow"
                ? { ...todo, id: result.id, pending: false }
                : todo,
            ),
        },
      });

      function Component() {
        const mutation = useFlow(flow, { store, events });
        const todos = useResource("todos:list", store) ?? [];
        const flowState = useFlowState(events, "createTodo");
        const mutationEvents = useMutationEvents(events);

        useEffect(() => {
          globalThis.__runMutation = () => mutation.run({ title: "Ship Mutaflow" });
          return () => {
            delete globalThis.__runMutation;
          };
        }, [mutation]);

        return React.createElement(
          "section",
          null,
          React.createElement("div", { id: "hook-stage" }, mutation.stage),
          React.createElement("div", { id: "event-stage" }, flowState),
          React.createElement("div", { id: "event-count" }, String(mutationEvents.length)),
          React.createElement("div", { id: "todo-count" }, String(todos.length)),
          React.createElement("div", { id: "todo-text" }, todos.map((todo) => `${todo.title}:${todo.pending ? "pending" : "done"}`).join(",")),
        );
      }

      const rendered = await renderWithRoot(Component);
      try {
        assert.equal(rendered.container.querySelector("#hook-stage")?.textContent, "idle");
        assert.equal(rendered.container.querySelector("#event-stage")?.textContent, "idle");
        assert.equal(rendered.container.querySelector("#event-count")?.textContent, "0");

        let runPromise;
        await act(async () => {
          runPromise = globalThis.__runMutation();
          await flush();
        });

        assert.equal(rendered.container.querySelector("#hook-stage")?.textContent, "running");
        assert.equal(rendered.container.querySelector("#event-stage")?.textContent, "optimistic");
        assert.equal(rendered.container.querySelector("#event-count")?.textContent, "2");
        assert.equal(rendered.container.querySelector("#todo-count")?.textContent, "1");
        assert.equal(rendered.container.querySelector("#todo-text")?.textContent, "Ship Mutaflow:pending");

        await act(async () => {
          deferred.resolve({ id: "todo:ship-mutaflow" });
          await runPromise;
          await flush();
        });

        assert.equal(rendered.container.querySelector("#hook-stage")?.textContent, "success");
        assert.equal(rendered.container.querySelector("#event-stage")?.textContent, "success");
        assert.equal(rendered.container.querySelector("#event-count")?.textContent, "4");
        assert.equal(rendered.container.querySelector("#todo-text")?.textContent, "Ship Mutaflow:done");
      } finally {
        await rendered.cleanup();
      }
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

