import { optimistic } from "mutaflow";
import {
  consistency,
  createInvalidationRegistry,
  definePaths,
  defineTags,
} from "mutaflow/next";
import {
  createNextSafeActionFlow,
  getNextSafeActionErrorKind,
  isNextSafeActionError,
} from "mutaflow/next-safe-action";

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

const safeTodoInvalidation = createInvalidationRegistry({
  tags: defineTags((tags) => ({
    todos: {
      list: () => tags.todos.list(),
      byId: (id: string) => tags.todos.byId(id),
    },
  })),
  paths: definePaths((paths) => ({
    todos: {
      byId: (id: string) => paths.todos.byId(id),
    },
  })),
});

export const createTodoSafeFlow = createNextSafeActionFlow({
  action: createTodoSafeAction,
  adapter: {
    name: "createTodoSafe",
  },
  meta: {
    feature: "todos",
    source: "next-safe-action-example",
  },
  beforeRun: ({ meta }) => {
    console.debug("[mutaflow] beforeRun safe action", meta);
  },
  middleware: [
    async (_context, next) => next(),
  ],
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
  consistency: ({ result }) =>
    consistency.staleWhileRevalidate({
      tags: [
        safeTodoInvalidation.tags.todos.list(),
        safeTodoInvalidation.tags.todos.byId(result.id),
      ],
      paths: [safeTodoInvalidation.paths.todos.byId(result.id)],
    }),
  afterSuccess: ({ meta, result, consistency }) => {
    console.debug("[mutaflow] safe action success", meta, result, consistency);
  },
  onError: ({ error }) => {
    if (isNextSafeActionError(error) && getNextSafeActionErrorKind(error) === "validation") {
      console.warn("safe action validation failed", error.details.validationErrors);
    }
  },
});
