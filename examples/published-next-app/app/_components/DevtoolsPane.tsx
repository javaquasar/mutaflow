"use client";

import { MutationDevtoolsPanel } from "@mutaflow/devtools";

import { events } from "../../lib/client-store";

export function DevtoolsPane() {
  return (
    <section
      style={{
        display: "grid",
        gap: 14,
        padding: 20,
        borderRadius: 24,
        background: "var(--panel)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--accent)" }}>
          Devtools
        </span>
        <h2 style={{ margin: 0, fontSize: 28 }}>Mutation timeline inspector</h2>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>
          Filter by flow name, inspect grouped runs, and watch consistency plus invalidation metadata land in the
          event stream.
        </p>
      </div>

      <MutationDevtoolsPanel store={events} initialFlowName="createTodoAction" />
    </section>
  );
}
