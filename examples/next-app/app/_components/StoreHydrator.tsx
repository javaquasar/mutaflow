"use client";

import { useEffect } from "react";

import type { ClientTodo } from "../lib/client-store";
import { hydrateTodos, store } from "../lib/client-store";

export function StoreHydrator({ initialTodos }: { initialTodos: ClientTodo[] }) {
  useEffect(() => {
    if ((store.get<ClientTodo[]>("todos:list") ?? []).length === 0) {
      hydrateTodos(initialTodos);
    }
  }, [initialTodos]);

  return null;
}
