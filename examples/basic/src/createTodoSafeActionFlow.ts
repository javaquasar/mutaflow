import { optimistic } from "mutaflow";
import {
  createNextSafeActionFlow,
  getNextSafeActionErrorKind,
  isNextSafeActionError,
} from "mutaflow/next-safe-action";
import { tags } from "mutaflow/next";

import type { CreateTodoInput, Todo } from "./createTodoFlow";

async function createTodoSafeAction(input: CreateTodoInput) {
  if (!input.title.trim()) {
    return {
      validationErrors: {
        title: ["Title is required"],
      },
    };
  }

  return {
    data: {
      id: `safe-${input.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: input.title,
    },
  };
}

export const createTodoSafeFlow = createNextSafeActionFlow({
  action: createTodoSafeAction,
  adapter: {
    name: "createTodoSafe",
  },
  optimistic: optimistic.insert<CreateTodoInput, Todo>({
    target: "todos:list",
    position: "start",
    item: (input) => ({
      id: `temp:${input.title}`,
      title: input.title,
      pending: true,
    }),
  }),
  reconcile: {
    target: "todos:list",
    onSuccess: (current, result) =>
      (Array.isArray(current) ? current : []).map((todo) =>
        typeof todo === "object" && todo !== null && "id" in todo && String(todo.id).startsWith("temp:")
          ? { ...todo, id: result.id, pending: false }
          : todo,
      ),
  },
  invalidate: ({ result }) => [
    tags.todos.list(),
    tags.todos.byId(result.id),
  ],
  onError: ({ error }) => {
    if (isNextSafeActionError(error) && getNextSafeActionErrorKind(error) === "validation") {
      console.warn("safe action validation failed", error.details.validationErrors);
    }
  },
});
