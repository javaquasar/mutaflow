import { CreateTodoButton } from "./CreateTodoButton";
import { MutationDebugPanel } from "./MutationDebugPanel";

export function App() {
  return (
    <main>
      <h1>Mutaflow Basic Example</h1>
      <p>A tiny example showing a flow definition, a client-side trigger, and a prototype devtools panel.</p>
      <CreateTodoButton />
      <MutationDebugPanel />
    </main>
  );
}
