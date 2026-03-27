"use client";

import { createFlow, optimistic } from "mutaflow";
import { consistency, createServerActionAdapter } from "mutaflow/next";

import { createTodoAction, type CreateTodoInput } from "../app/actions";
import type { ClientTodo } from "./client-store";

export const createTodoFlow = createFlow({
  action: createServerActionAdapter(createTodoAction),
  optimistic: optimistic.insert<CreateTodoInput, ClientTodo>({
    target: "todos:list",
    position: "start",
    item: (input) => ({
      id: `temp:${input.mode}:${input.title}`,
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
  consistency: ({ result }) =>
    consistency.immediate({
      tags: [
        { kind: "tag", value: "todos.list" },
        { kind: "tag", value: `todos.byId.${result.id}` },
      ],
      paths: [{ kind: "path", value: `/todos/${result.id}` }],
    }),
  meta: { demo: "published-next-app" },
});
