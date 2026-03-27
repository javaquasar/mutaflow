"use client";

import { useState } from "react";

import { useFlow, useFlowState, useMutationEvents, useResource } from "mutaflow/react";

import { createTodoFlow } from "../../lib/flows";
import { events, type ClientTodo, store } from "../../lib/client-store";

const scenarioCopy = {
  fast: "Fast success: optimistic insert appears and reconciles almost immediately.",
  slow: "Slow success: optimistic insert stays visible longer so you can inspect the transition.",
  error: "Server error: optimistic insert rolls back and the error stays in the timeline.",
} as const;

export function TodoShowcase() {
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<keyof typeof scenarioCopy>("fast");
  const flow = useFlow(createTodoFlow, {
    store,
    events,
    retries: 1,
    meta: { source: "published-next-app" },
  });
  const todos = useResource<ClientTodo[]>("todos:list", store) ?? [];
  const flowState = useFlowState(events, "createTodoAction");
  const mutationEvents = useMutationEvents(events);
  const latestEvent = mutationEvents[mutationEvents.length - 1];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    const result = await flow.run({ title: nextTitle, mode }, { meta: { scenario: mode } });

    if (!result.error) {
      setTitle("");
    }
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
        padding: 24,
        borderRadius: 24,
        background: "var(--panel)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--accent)" }}>
          Interactive flow
        </span>
        <h2 style={{ margin: 0, fontSize: 32 }}>Trigger an optimistic mutation and watch what changes</h2>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{scenarioCopy[mode]}</p>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor="todo-title" style={{ fontSize: 14, color: "var(--muted)" }}>
            Todo title
          </label>
          <input
            id="todo-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ship publish-ready consumer example"
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "white",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor="scenario" style={{ fontSize: 14, color: "var(--muted)" }}>
            Scenario
          </label>
          <select
            id="scenario"
            value={mode}
            onChange={(event) => setMode(event.target.value as keyof typeof scenarioCopy)}
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "white",
            }}
          >
            <option value="fast">Fast success</option>
            <option value="slow">Slow success</option>
            <option value="error">Server error</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={flow.pending}
            style={{
              padding: "13px 18px",
              borderRadius: 14,
              border: 0,
              background: flow.pending ? "#d8b49b" : "var(--accent)",
              color: "white",
              cursor: flow.pending ? "default" : "pointer",
            }}
          >
            {flow.pending ? "Running mutation..." : "Run flow"}
          </button>
          <button
            type="button"
            onClick={() => flow.cancel()}
            disabled={!flow.pending}
            style={{
              padding: "13px 18px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "white",
            }}
          >
            Cancel latest
          </button>
        </div>
      </form>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        }}
      >
        {[
          { label: "Hook stage", value: flow.stage },
          { label: "Event stage", value: flowState },
          { label: "Active runs", value: String(flow.activeCount) },
          { label: "Last event", value: latestEvent?.type ?? "none" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: 16,
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--panel-strong)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{item.label}</div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <h3 style={{ margin: 0, fontSize: 22 }}>Resource store snapshot</h3>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>{todos.length} visible items</span>
        </div>

        <ul style={{ display: "grid", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
          {todos.map((todo) => (
            <li
              key={todo.id}
              style={{
                display: "grid",
                gap: 6,
                padding: 16,
                borderRadius: 18,
                border: "1px solid var(--line)",
                background: todo.pending ? "var(--accent-soft)" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{todo.title}</strong>
                <span
                  style={{
                    color: todo.pending ? "var(--accent)" : "var(--success)",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {todo.pending ? "optimistic" : "persisted"}
                </span>
              </div>
              <code style={{ color: "var(--muted)", fontSize: 13 }}>{todo.id}</code>
            </li>
          ))}
        </ul>
      </div>

      {flow.error ? (
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            background: "rgba(166, 59, 40, 0.1)",
            border: "1px solid rgba(166, 59, 40, 0.28)",
            color: "var(--danger)",
          }}
        >
          {String(flow.error)}
        </div>
      ) : null}
    </section>
  );
}
