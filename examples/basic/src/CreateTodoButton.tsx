import { useFlow } from "mutaflow/react";

import { createTodoFlow } from "./createTodoFlow";
import { store } from "./store";

export function CreateTodoButton() {
  const flow = useFlow(createTodoFlow, { store });

  async function handleCreate() {
    const before = store.get("todos:list");
    const result = await flow.run({ title: "Ship Mutaflow" });
    const after = store.get("todos:list");

    console.log("Before", before);
    console.log("After", after);

    if (result.error) {
      console.error("Failed to create todo", result.error);
      return;
    }

    console.log("Invalidations", result.invalidations);
    console.log("Redirect", result.redirectTo);
  }

  return (
    <button disabled={flow.pending} onClick={handleCreate}>
      {flow.pending ? "Creating..." : "Create todo"}
    </button>
  );
}
