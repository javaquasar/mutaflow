import { useSyncExternalStore } from "react";

import type { MutationEvent, MutationEventStore } from "../types.js";

export function useMutationEvents(store: MutationEventStore): MutationEvent[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getEvents,
    store.getEvents,
  );
}
