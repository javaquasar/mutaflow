import { DevtoolsPanel } from "./_components/DevtoolsPanel";
import { StoreHydrator } from "./_components/StoreHydrator";
import { TodoExperience } from "./_components/TodoExperience";
import { listTodos } from "../lib/data";

export default async function Page() {
  const todos = await listTodos();

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: 32, display: "grid", gap: 24 }}>
      <StoreHydrator initialTodos={todos} />

      <section
        style={{
          display: "grid",
          gap: 12,
          padding: 24,
          borderRadius: 24,
          background: "rgba(255,255,255,0.86)",
          border: "1px solid rgba(16, 32, 51, 0.08)",
          boxShadow: "0 24px 60px rgba(18, 43, 70, 0.08)",
        }}
      >
        <span style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "#145da0" }}>
          Next App Router Example
        </span>
        <h1 style={{ margin: 0, fontSize: 40 }}>Mutaflow with real server actions and a devtools panel</h1>
        <p style={{ margin: 0, color: "#425466", maxWidth: 760 }}>
          This example shows a real App Router page using a server action, an optimistic resource store,
          event-driven flow tracking, and a prototype timeline inspector from <code>@mutaflow/devtools</code>.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
        <TodoExperience />
        <DevtoolsPanel />
      </section>
    </main>
  );
}
