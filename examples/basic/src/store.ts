import { createMutationEventStore, createResourceStore } from "mutaflow";

import type { Todo } from "./createTodoFlow";

export const store = createResourceStore({
  "todos:list": [] as Todo[],
});

export const events = createMutationEventStore();
