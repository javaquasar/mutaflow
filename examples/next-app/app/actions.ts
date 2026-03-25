"use server";

import { insertTodo } from "../lib/data";

export type CreateTodoInput = {
  title: string;
};

export async function createTodoAction(input: CreateTodoInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required");
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  const todo = await insertTodo(title);
  return {
    id: todo.id,
    title: todo.title,
  };
}
