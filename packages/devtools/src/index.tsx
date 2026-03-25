import React from "react";

import { useMutationEvents } from "mutaflow/react";
import type { MutationEvent, MutationEventStore } from "mutaflow";

type MutationTimelinePanelProps = {
  store: MutationEventStore;
  flowName?: string;
  maxItems?: number;
  onSelectEvent?: (event: MutationEvent) => void;
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #d0d7de",
  borderRadius: 12,
  padding: 16,
  background: "#ffffff",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 10,
  cursor: "pointer",
  background: "#f8fafc",
};

export function MutationTimelinePanel({
  store,
  flowName,
  maxItems = 20,
  onSelectEvent,
}: MutationTimelinePanelProps) {
  const events = useMutationEvents(store);
  const filteredEvents = flowName
    ? events.filter((event) => event.flowName === flowName)
    : events;
  const visibleEvents = filteredEvents.slice(-maxItems).reverse();

  return (
    <section style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>Mutation Timeline</h3>
      <ul style={listStyle}>
        {visibleEvents.map((event) => (
          <li
            key={`${event.flowId}:${event.type}:${event.timestamp}`}
            style={itemStyle}
            onClick={() => onSelectEvent?.(event)}
          >
            <strong>{event.type}</strong>
            <div>flow: {event.flowName}</div>
            <div>id: {event.flowId}</div>
            <div>attempt: {event.attempt}</div>
            <div>stage: {event.stage}</div>
            {event.target ? <div>target: {event.target}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MutationEventInspector({ event }: { event: MutationEvent | null }) {
  return (
    <section style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>Event Inspector</h3>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {event ? JSON.stringify(event, null, 2) : "Select a timeline event to inspect it."}
      </pre>
    </section>
  );
}
