import { createFlow, optimistic } from "mutaflow";
import {
  createInvalidationRegistry,
  createServerActionAdapter,
  definePaths,
  defineTags,
} from "mutaflow/next";

export type CreateTodoInput = {
  title: string;
};

export type Todo = {
  id: string;
  title: string;
  pending?: boolean;
};

export async function createTodo(input: CreateTodoInput): Promise<{ id: string; title: string }> {
  return { id: `todo-${input.title.toLowerCase().replace(/\s+/g, "-")}`, title: input.title };
}

export const todoInvalidation = createInvalidationRegistry({
  tags: defineTags((tags) => ({
    todos: {
      list: () => tags.todos.list(),
      byId: (id: string) => tags.todos.byId(id),
    },
  })),
  paths: definePaths((paths) => ({
    todos: {
      list: () => paths.todos.list(),
      byId: (id: string) => paths.todos.byId(id),
    },
  })),
});

export const createTodoFlow = createFlow({
  action: createServerActionAdapter(createTodo),
  meta: {
    feature: "todos",
    source: "basic-example",
  },
  middleware: [
    async (context, next) => {
      console.debug("[mutaflow] middleware before", context.meta, context.input);
      const result = await next();
      console.debug("[mutaflow] middleware after", result);
      return result;
    },
  ],
  beforeRun: ({ meta, input }) => {
    console.debug("[mutaflow] beforeRun", meta, input);
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
    todoInvalidation.tags.todos.list(),
    todoInvalidation.tags.todos.byId(result.id),
    todoInvalidation.paths.todos.byId(result.id),
  ],
  afterSuccess: ({ result, meta }) => {
    console.debug("[mutaflow] afterSuccess", meta, result);
  },
  afterError: ({ error, meta }) => {
    console.error("[mutaflow] afterError", meta, error);
  },
  onSettled: ({ cancelled, meta }) => {
    console.debug("[mutaflow] onSettled", meta, { cancelled });
  },
  redirect: ({ result }) => `/todos/${result.id}`,
});
