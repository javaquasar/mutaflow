export type TodoRecord = {
  id: string;
  title: string;
  createdAt: string;
};

const todos: TodoRecord[] = [
  {
    id: "todo-vision",
    title: "See optimistic UI appear instantly",
    createdAt: new Date("2026-03-27T09:30:00.000Z").toISOString(),
  },
  {
    id: "todo-devtools",
    title: "Inspect grouped mutation events in the devtools panel",
    createdAt: new Date("2026-03-27T09:45:00.000Z").toISOString(),
  },
];

export async function listTodos(): Promise<TodoRecord[]> {
  return [...todos];
}

export async function insertTodo(title: string): Promise<TodoRecord> {
  const todo = {
    id: `todo-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
  } satisfies TodoRecord;

  todos.unshift(todo);
  return todo;
}
