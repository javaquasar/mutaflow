"use client";

import { createMutationEventStore, createResourceStore } from "mutaflow";

export type ClientTodo = {
  id: string;
  title: string;
  pending?: boolean;
};

export const store = createResourceStore({
  "todos:list": [] as ClientTodo[],
});

export const events = createMutationEventStore();

export function hydrateTodos(todos: ClientTodo[]) {
  store.set("todos:list", todos);
}
