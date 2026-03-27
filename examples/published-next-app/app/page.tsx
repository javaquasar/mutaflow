import { DemoShell } from "./_components/DemoShell";
import { StoreHydrator } from "./_components/StoreHydrator";
import { listTodos } from "../lib/data";

export default async function Page() {
  const todos = await listTodos();

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 64px", display: "grid", gap: 24 }}>
      <StoreHydrator initialTodos={todos} />
      <DemoShell />
    </main>
  );
}
