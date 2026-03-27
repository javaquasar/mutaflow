"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { consistency } from "mutaflow/next";
import { createNextServerHelpers } from "mutaflow/next/server";

import { insertTodo } from "../lib/data";

export type CreateTodoInput = {
  title: string;
  mode: "fast" | "slow" | "error";
};

const nextServer = createNextServerHelpers({
  revalidateTag,
  revalidatePath,
});

export async function createTodoAction(input: CreateTodoInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required");
  }

  if (input.mode === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 1400));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (input.mode === "error") {
    throw new Error("Server rejected this mutation so you can watch rollback happen.");
  }

  const todo = await insertTodo(title);

  await nextServer.applyConsistency(
    consistency.immediate({
      tags: [
        { kind: "tag", value: "todos.list" },
        { kind: "tag", value: `todos.byId.${todo.id}` },
      ],
      paths: [{ kind: "path", value: `/todos/${todo.id}` }],
    }),
  );

  return {
    id: todo.id,
    title: todo.title,
    mode: input.mode,
  };
}
