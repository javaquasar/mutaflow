"use client";

import { MutationDevtoolsPanel } from "@mutaflow/devtools";

import { events } from "../../lib/client-store";

export function DevtoolsPanel() {
  return (
    <MutationDevtoolsPanel
      store={events}
      initialFlowName="createTodoAction"
    />
  );
}
