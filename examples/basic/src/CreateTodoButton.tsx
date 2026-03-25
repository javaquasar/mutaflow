import { useFlow, useFlowState, useMutationEvents, useResource } from "mutaflow/react";

import { createTodoFlow } from "./createTodoFlow";
import { events, store } from "./store";

export function CreateTodoButton() {
  const flow = useFlow(createTodoFlow, { store, events, retries: 1 });
  const todos = useResource("todos:list", store) ?? [];
  const flowState = useFlowState(events, "createTodo");
  const mutationEvents = useMutationEvents(events);

  async function handleCreate() {
    const result = await flow.run({ title: `Ship Mutaflow ${flow.activeCount + 1}` });

    if (result.error) {
      console.error("Failed to create todo", result.error);
      return;
    }

    console.log("Todos", store.get("todos:list"));
    console.log("Events", events.getEvents());
    console.log("Invalidations", result.invalidations);
    console.log("Redirect", result.redirectTo);
  }

  return (
    <section>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button disabled={flow.pending} onClick={handleCreate}>
          {flow.pending ? "Creating..." : "Create todo"}
        </button>
        <button disabled={!flow.pending} onClick={() => flow.cancel()}>
          Cancel latest
        </button>
      </div>
      <p>Last flow stage: {flowState}</p>
      <p>Hook stage: {flow.stage}</p>
      <p>Current flow id: {flow.currentFlowId ?? "none"}</p>
      <p>Active count: {flow.activeCount}</p>
      <p>Event count: {mutationEvents.length}</p>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title}
            {todo.pending ? " (pending)" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
