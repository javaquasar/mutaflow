export type TodoRecord = {
  id: string;
  title: string;
  createdAt: string;
};

const todos: TodoRecord[] = [
  {
    id: "todo-initial",
    title: "Read Mutaflow source",
    createdAt: new Date("2026-03-25T09:00:00.000Z").toISOString(),
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
