import React from "react";

import { MutationDevtoolsPanel } from "@mutaflow/devtools";

import { events } from "./store";

export function MutationDebugPanel() {
  return (
    <MutationDevtoolsPanel
      store={events}
      initialFlowName="createTodo"
    />
  );
}
