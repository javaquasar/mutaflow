"use client";

import { useState } from "react";

import { MutationEventInspector, MutationTimelinePanel } from "@mutaflow/devtools";
import type { MutationEvent } from "mutaflow";

import { events } from "../../lib/client-store";

export function DevtoolsPanel() {
  const [selectedEvent, setSelectedEvent] = useState<MutationEvent | null>(null);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <MutationTimelinePanel
        store={events}
        flowName="createTodoAction"
        onSelectEvent={setSelectedEvent}
      />
      <MutationEventInspector event={selectedEvent} />
    </section>
  );
}
