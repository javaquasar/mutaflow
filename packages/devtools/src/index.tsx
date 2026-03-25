import React, { useState } from "react";

import { useMutationEvents } from "mutaflow/react";
import type { MutationEvent, MutationEventStore, MutationEventType } from "mutaflow";

type MutationTimelinePanelProps = {
  store: MutationEventStore;
  flowName?: string;
  eventType?: MutationEventType | "all";
  maxItems?: number;
  groupByFlowId?: boolean;
  showSummary?: boolean;
  onSelectEvent?: (event: MutationEvent) => void;
};

type MutationSummaryPanelProps = {
  events: MutationEvent[];
};

type MutationDevtoolsPanelProps = {
  store: MutationEventStore;
  initialFlowName?: string;
  initialEventType?: MutationEventType | "all";
  maxItems?: number;
  groupByFlowId?: boolean;
};

type EventGroup = {
  flowId: string;
  flowName: string;
  latest: MutationEvent;
  events: MutationEvent[];
  retries: number;
};

const eventTypes: Array<MutationEventType | "all"> = [
  "all",
  "flow:start",
  "flow:optimistic-applied",
  "flow:retrying",
  "flow:success",
  "flow:error",
  "flow:cancelled",
  "flow:rolled-back",
  "flow:reconciled",
];

const panelStyle: React.CSSProperties = {
  border: "1px solid #d0d7de",
  borderRadius: 12,
  padding: 16,
  background: "#ffffff",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  cursor: "pointer",
  background: "#f8fafc",
};

const inlineMetaStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  background: "#e2e8f0",
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  marginBottom: 16,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#f8fafc",
};

const groupHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

function formatInvalidations(event: MutationEvent) {
  return event.invalidations?.map((entry) => `${entry.kind}:${entry.value}`).join(", ") ?? "none";
}

function formatMeta(event: MutationEvent) {
  return event.meta ? JSON.stringify(event.meta) : "none";
}

function filterEvents(
  events: MutationEvent[],
  flowName: string | undefined,
  eventType: MutationEventType | "all" | undefined,
) {
  const normalizedFlowName = flowName?.trim().toLowerCase();

  return events.filter((event) => {
    const matchesFlowName = normalizedFlowName
      ? event.flowName.toLowerCase().includes(normalizedFlowName)
      : true;
    const matchesEventType = eventType && eventType !== "all"
      ? event.type === eventType
      : true;

    return matchesFlowName && matchesEventType;
  });
}

function groupEvents(events: MutationEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();

  for (const event of events) {
    const existing = groups.get(event.flowId);

    if (existing) {
      existing.events.push(event);
      if (event.timestamp >= existing.latest.timestamp) {
        existing.latest = event;
      }
      if (event.type === "flow:retrying") {
        existing.retries += 1;
      }
      continue;
    }

    groups.set(event.flowId, {
      flowId: event.flowId,
      flowName: event.flowName,
      latest: event,
      events: [event],
      retries: event.type === "flow:retrying" ? 1 : 0,
    });
  }

  return [...groups.values()].sort((left, right) => right.latest.timestamp - left.latest.timestamp);
}

export function MutationSummaryPanel({ events }: MutationSummaryPanelProps) {
  const success = events.filter((event) => event.type === "flow:success").length;
  const errors = events.filter((event) => event.type === "flow:error").length;
  const cancelled = events.filter((event) => event.type === "flow:cancelled").length;
  const retries = events.filter((event) => event.type === "flow:retrying").length;

  return (
    <section style={panelStyle}>
      <h3 style={sectionTitleStyle}>Mutation Summary</h3>
      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <strong>{events.length}</strong>
          <div>Total Events</div>
        </div>
        <div style={summaryCardStyle}>
          <strong>{success}</strong>
          <div>Success</div>
        </div>
        <div style={summaryCardStyle}>
          <strong>{errors}</strong>
          <div>Errors</div>
        </div>
        <div style={summaryCardStyle}>
          <strong>{cancelled}</strong>
          <div>Cancelled</div>
        </div>
        <div style={summaryCardStyle}>
          <strong>{retries}</strong>
          <div>Retries</div>
        </div>
      </div>
    </section>
  );
}

export function MutationTimelinePanel({
  store,
  flowName,
  eventType = "all",
  maxItems = 20,
  groupByFlowId = true,
  showSummary = true,
  onSelectEvent,
}: MutationTimelinePanelProps) {
  const events = useMutationEvents(store);
  const filteredEvents = filterEvents(events, flowName, eventType);
  const visibleEvents = filteredEvents.slice(-maxItems).reverse();
  const groupedEvents = groupByFlowId ? groupEvents(visibleEvents) : [];

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {showSummary ? <MutationSummaryPanel events={filteredEvents} /> : null}
      <section style={panelStyle}>
        <h3 style={sectionTitleStyle}>Mutation Timeline</h3>
        <ul style={listStyle}>
          {groupByFlowId
            ? groupedEvents.map((group) => (
                <li
                  key={group.flowId}
                  style={itemStyle}
                  onClick={() => onSelectEvent?.(group.latest)}
                >
                  <div style={groupHeaderStyle}>
                    <div>
                      <strong>{group.latest.type}</strong>
                      <div>flow: {group.flowName}</div>
                      <div>id: {group.flowId}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>stage: {group.latest.stage}</div>
                      <div>events: {group.events.length}</div>
                      <div>retries: {group.retries}</div>
                    </div>
                  </div>
                  <div style={inlineMetaStyle}>
                    <span style={badgeStyle}>consistency: {group.latest.consistency?.strategy ?? "none"}</span>
                    <span style={badgeStyle}>read-your-own-writes: {String(group.latest.consistency?.readYourOwnWrites ?? false)}</span>
                    <span style={badgeStyle}>target: {group.latest.target ?? "none"}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>invalidations: {formatInvalidations(group.latest)}</div>
                  <div style={{ marginTop: 4 }}>meta: {formatMeta(group.latest)}</div>
                </li>
              ))
            : visibleEvents.map((event) => (
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
                  <div>consistency: {event.consistency?.strategy ?? "none"}</div>
                  <div>invalidations: {formatInvalidations(event)}</div>
                  <div>meta: {formatMeta(event)}</div>
                  {event.target ? <div>target: {event.target}</div> : null}
                </li>
              ))}
        </ul>
      </section>
    </section>
  );
}

export function MutationEventInspector({ event }: { event: MutationEvent | null }) {
  return (
    <section style={panelStyle}>
      <h3 style={sectionTitleStyle}>Event Inspector</h3>
      {event ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div><strong>type:</strong> {event.type}</div>
          <div><strong>flow:</strong> {event.flowName}</div>
          <div><strong>flowId:</strong> {event.flowId}</div>
          <div><strong>attempt:</strong> {event.attempt}</div>
          <div><strong>stage:</strong> {event.stage}</div>
          <div><strong>target:</strong> {event.target ?? "none"}</div>
          <div><strong>consistency:</strong> {event.consistency?.strategy ?? "none"}</div>
          <div><strong>read-your-own-writes:</strong> {String(event.consistency?.readYourOwnWrites ?? false)}</div>
          <div><strong>invalidations:</strong> {formatInvalidations(event)}</div>
          <div><strong>meta:</strong> {formatMeta(event)}</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(event, null, 2)}
          </pre>
        </div>
      ) : (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          Select a timeline event to inspect it.
        </pre>
      )}
    </section>
  );
}

export function MutationDevtoolsPanel({
  store,
  initialFlowName = "",
  initialEventType = "all",
  maxItems = 20,
  groupByFlowId = true,
}: MutationDevtoolsPanelProps) {
  const [selectedEvent, setSelectedEvent] = useState<MutationEvent | null>(null);
  const [flowNameFilter, setFlowNameFilter] = useState(initialFlowName);
  const [eventTypeFilter, setEventTypeFilter] = useState<MutationEventType | "all">(initialEventType);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <section style={panelStyle}>
        <h3 style={sectionTitleStyle}>Devtools Filters</h3>
        <div style={filterGridStyle}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Flow Name</span>
            <input
              value={flowNameFilter}
              onChange={(event) => setFlowNameFilter(event.target.value)}
              placeholder="createTodo"
              style={{ padding: 8, borderRadius: 8, border: "1px solid #cbd5e1" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Event Type</span>
            <select
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value as MutationEventType | "all")}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #cbd5e1" }}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <MutationTimelinePanel
        store={store}
        flowName={flowNameFilter}
        eventType={eventTypeFilter}
        maxItems={maxItems}
        groupByFlowId={groupByFlowId}
        showSummary
        onSelectEvent={setSelectedEvent}
      />
      <MutationEventInspector event={selectedEvent} />
    </section>
  );
}
