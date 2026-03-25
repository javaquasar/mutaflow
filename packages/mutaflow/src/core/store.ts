import type { ResourceListener, ResourceStore } from "../types.js";

export function createResourceStore(initialState: Record<string, unknown> = {}): ResourceStore {
  const values = new Map<string, unknown>(Object.entries(initialState));
  const listeners = new Map<string, Set<ResourceListener>>();

  function emit(target: string) {
    const targetListeners = listeners.get(target);

    if (!targetListeners) {
      return;
    }

    for (const listener of targetListeners) {
      listener();
    }
  }

  return {
    register(target, initialValue) {
      if (!values.has(target)) {
        values.set(target, initialValue);
      }
    },

    has(target) {
      return values.has(target);
    },

    get<TValue>(target: string) {
      return values.get(target) as TValue | undefined;
    },

    set<TValue>(target: string, value: TValue) {
      values.set(target, value);
      emit(target);
      return value;
    },

    update<TValue>(target: string, updater: (current: TValue | undefined) => TValue) {
      const current = values.get(target) as TValue | undefined;
      const nextValue = updater(current);
      values.set(target, nextValue);
      emit(target);
      return nextValue;
    },

    subscribe(target, listener) {
      const targetListeners = listeners.get(target) ?? new Set<ResourceListener>();
      targetListeners.add(listener);
      listeners.set(target, targetListeners);

      return () => {
        const currentListeners = listeners.get(target);

        if (!currentListeners) {
          return;
        }

        currentListeners.delete(listener);

        if (currentListeners.size === 0) {
          listeners.delete(target);
        }
      };
    },

    snapshot() {
      return Object.fromEntries(values.entries());
    },
  };
}
