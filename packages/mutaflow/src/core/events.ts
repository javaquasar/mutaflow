import type { MutationEvent, MutationEventListener, MutationEventStore } from "../types.js";

export function createMutationEventStore(): MutationEventStore {
  let events: MutationEvent[] = [];
  const listeners = new Set<MutationEventListener>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    emit(event) {
      events = [...events, event];
      notify();
    },

    getEvents() {
      return events;
    },

    clear() {
      events = [];
      notify();
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
