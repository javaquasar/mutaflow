"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";

import { consistency } from "mutaflow/next";
import { createNextServerHelpers } from "mutaflow/next/server";

import { insertTodo } from "../lib/data";

export type CreateTodoInput = {
  title: string;
};

const nextServer = createNextServerHelpers({
  revalidateTag,
  updateTag,
  revalidatePath,
});

export async function createTodoAction(input: CreateTodoInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required");
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

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
  };
}
