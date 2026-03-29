export interface TodoRow {
  id: number;
  text: string;
  completed: number; // SQLite stores as 0 | 1
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  text: string;
}

export interface UpdateTodoInput {
  text?: string;
  completed?: boolean;
}
