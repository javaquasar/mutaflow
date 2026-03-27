"use client";

import { DevtoolsPane } from "./DevtoolsPane";
import { TodoShowcase } from "./TodoShowcase";

const cards = [
  {
    title: "1. Fire a mutation",
    body: "Pick a scenario and submit. Mutaflow runs the server action through a flow, not ad hoc event handlers.",
  },
  {
    title: "2. Watch optimistic UI",
    body: "A pending todo appears immediately in the shared resource store so the page reacts before the server responds.",
  },
  {
    title: "3. Inspect the outcome",
    body: "Success reconciles the optimistic item. Errors roll it back. Devtools keep the whole story visible.",
  },
];

export function DemoShell() {
  return (
    <>
      <section
        style={{
          display: "grid",
          gap: 18,
          padding: 28,
          borderRadius: 28,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
          backdropFilter: "blur(20px)",
        }}
      >
        <span style={{ fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--accent)" }}>
          Published npm demo
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 5vw, 4.6rem)", lineHeight: 1.02 }}>
          Mutaflow running from published packages, not local workspace links
        </h1>
        <p style={{ margin: 0, maxWidth: 860, color: "var(--muted)", fontSize: 18, lineHeight: 1.6 }}>
          This page is meant to make the library legible. You can trigger a successful mutation, a slower mutation
          for inspection, or an error that rolls back optimistic state. The devtools panel shows the event timeline,
          grouped flows, metadata, consistency policy, and invalidations.
        </p>
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {cards.map((card) => (
            <article
              key={card.title}
              style={{
                padding: 18,
                borderRadius: 20,
                background: "var(--panel-strong)",
                border: "1px solid var(--line)",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>{card.title}</h2>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 24,
          alignItems: "start",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(340px, 0.95fr)",
        }}
      >
        <TodoShowcase />
        <DevtoolsPane />
      </section>
    </>
  );
}
