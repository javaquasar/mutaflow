"use client";

import { useState } from "react";

import { useFlow, useFlowState, useMutationEvents, useResource } from "mutaflow/react";

import { events, type ClientTodo, store } from "../../lib/client-store";
import { createTodoFlow } from "../../lib/flows";

export function TodoExperience() {
  const [title, setTitle] = useState("");
  const mutation = useFlow(createTodoFlow, { store, events, retries: 1 });
  const todos = useResource<ClientTodo[]>("todos:list", store) ?? [];
  const flowState = useFlowState(events, "createTodoAction");
  const mutationEvents = useMutationEvents(events);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    const result = await mutation.run({ title: nextTitle });

    if (!result.error) {
      setTitle("");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Create a todo through a real server action"
          style={{
            minWidth: 320,
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #c7d7e6",
            background: "white",
          }}
        />
        <button
          type="submit"
          disabled={mutation.pending}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: 0,
            background: mutation.pending ? "#8fb4da" : "#145da0",
            color: "white",
          }}
        >
          {mutation.pending ? "Creating..." : "Create todo"}
        </button>
        <button
          type="button"
          disabled={!mutation.pending}
          onClick={() => mutation.cancel()}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #d0d7de",
            background: "white",
          }}
        >
          Cancel latest
        </button>
      </form>

      <div style={{ display: "grid", gap: 4, color: "#425466", fontSize: 14 }}>
        <div>Hook stage: {mutation.stage}</div>
        <div>Event stage: {flowState}</div>
        <div>Current flow id: {mutation.currentFlowId ?? "none"}</div>
        <div>Active count: {mutation.activeCount}</div>
        <div>Event count: {mutationEvents.length}</div>
      </div>

      <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #dce7f2",
              background: todo.pending ? "#eef6ff" : "white",
            }}
          >
            <strong>{todo.title}</strong>
            {todo.pending ? <span> (pending)</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
