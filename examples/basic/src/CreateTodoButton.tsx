import { useFlow } from "mutaflow/react";

import { createTodoFlow } from "./createTodoFlow";

export function CreateTodoButton() {
  const flow = useFlow(createTodoFlow);

  async function handleCreate() {
    const result = await flow.run({ title: "Ship Mutaflow" });

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
