import type { Knex } from 'knex';
import type { Todo, TodoRow } from '../types/todo';
import type { CreateTodoInput, UpdateTodoInput } from '../schemas/todoSchemas';

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTodoService(db: Knex) {
  async function getAll(): Promise<Todo[]> {
    const rows = await db<TodoRow>('todos').orderByRaw(
      'completed ASC, created_at DESC',
    );
    return rows.map(toTodo);
  }

  async function create(input: CreateTodoInput): Promise<Todo> {
    const [id] = await db<TodoRow>('todos').insert({ text: input.text });
    const row = await db<TodoRow>('todos').where({ id }).first();
    return toTodo(row!);
  }

  async function update(id: number, input: UpdateTodoInput): Promise<Todo> {
    const existing = await db<TodoRow>('todos').where({ id }).first();
    if (!existing) {
      const err = new Error('Todo not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    await db<TodoRow>('todos')
      .where({ id })
      .update({
        ...(input.text !== undefined && { text: input.text }),
        ...(input.completed !== undefined && { completed: input.completed ? 1 : 0 }),
        updated_at: db.fn.now() as unknown as string,
      });

    const updated = await db<TodoRow>('todos').where({ id }).first();
    return toTodo(updated!);
  }

  async function remove(id: number): Promise<void> {
    const count = await db<TodoRow>('todos').where({ id }).delete();
    if (count === 0) {
      const err = new Error('Todo not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  }

  return { getAll, create, update, remove };
}

export type TodoService = ReturnType<typeof createTodoService>;
