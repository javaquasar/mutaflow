import { useSyncExternalStore } from "react";

import type { ResourceStore } from "../types.js";

export function useResource<TValue>(
  target: string,
  store: ResourceStore,
): TValue | undefined {
  return useSyncExternalStore(
    (listener) => store.subscribe(target, listener),
    () => store.get<TValue>(target),
    () => store.get<TValue>(target),
  );
}
