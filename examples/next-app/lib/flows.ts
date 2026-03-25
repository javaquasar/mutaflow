"use client";

import { createFlow, optimistic } from "mutaflow";
import {
  createInvalidationRegistry,
  createServerActionAdapter,
  definePaths,
  defineTags,
} from "mutaflow/next";

import { createTodoAction, type CreateTodoInput } from "../app/actions";
import type { ClientTodo } from "./client-store";

const todoInvalidation = createInvalidationRegistry({
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

export const createTodoFlow = createFlow({
  action: createServerActionAdapter(createTodoAction),
  optimistic: optimistic.insert<CreateTodoInput, ClientTodo>({
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
        String(todo.id).startsWith("temp:") && todo.title === result.title
          ? { ...todo, id: result.id, pending: false }
          : todo,
      ),
  },
  invalidate: ({ result }) => [
    todoInvalidation.tags.todos.list(),
    todoInvalidation.tags.todos.byId(result.id),
    todoInvalidation.paths.todos.byId(result.id),
  ],
  redirect: ({ result }) => `/todos/${result.id}`,
});
