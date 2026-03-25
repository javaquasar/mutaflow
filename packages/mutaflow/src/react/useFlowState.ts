import { useMutationEvents } from "./useMutationEvents.js";

import type { FlowStage, MutationEventStore } from "../types.js";

export function useFlowState(store: MutationEventStore, flowName?: string): FlowStage {
  const events = useMutationEvents(store);
  const filteredEvents = flowName
    ? events.filter((event) => event.flowName === flowName)
    : events;
  const lastEvent = filteredEvents[filteredEvents.length - 1];

  return lastEvent?.stage ?? "idle";
}
