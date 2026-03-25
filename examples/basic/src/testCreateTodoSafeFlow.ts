import { createTestStore, expectEvents, expectReconciled, runFlowAndCollectEvents } from "@mutaflow/testkit";

import { createTodoSafeFlow } from "./createTodoSafeActionFlow";

async function verifyCreateTodoSafeFlow() {
  const testStore = createTestStore({
    "todos:list": [],
  });

  const run = await runFlowAndCollectEvents(
    createTodoSafeFlow,
    { title: "Ship Mutaflow" },
    testStore,
  );

  expectEvents(run, [
    "flow:start",
    "flow:optimistic-applied",
    "flow:reconciled",
    "flow:success",
  ]);

  expectReconciled(run, "todos:list", [
    { id: "safe-ship-mutaflow", title: "Ship Mutaflow", pending: false },
  ]);
}

void verifyCreateTodoSafeFlow();
