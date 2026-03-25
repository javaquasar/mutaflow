import { createResourceStore } from "mutaflow";

import type { Todo } from "./createTodoFlow";

export const store = createResourceStore({
  "todos:list": [] as Todo[],
});
