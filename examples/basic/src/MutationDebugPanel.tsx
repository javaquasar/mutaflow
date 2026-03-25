import React, { useState } from "react";

import { MutationEventInspector, MutationTimelinePanel } from "@mutaflow/devtools";
import type { MutationEvent } from "mutaflow";

import { events } from "./store";

export function MutationDebugPanel() {
  const [selectedEvent, setSelectedEvent] = useState<MutationEvent | null>(null);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <MutationTimelinePanel
        store={events}
        flowName="createTodo"
        onSelectEvent={setSelectedEvent}
      />
      <MutationEventInspector event={selectedEvent} />
    </section>
  );
}
