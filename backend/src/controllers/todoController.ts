import { Request, Response, NextFunction } from 'express';
import { CreateTodoSchema, UpdateTodoSchema } from '../schemas/todoSchemas';
import type { TodoService } from '../services/todoService';

export function createTodoController(service: TodoService) {
  async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todos = await service.getAll();
      res.json(todos);
    } catch (err) {
      next(err);
    }
  }

  async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateTodoSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Validation error';
        const err = new Error(message) as Error & { statusCode: number };
        err.statusCode = 400;
        return next(err);
      }
      const todo = await service.create(parsed.data);
      res.status(201).json(todo);
    } catch (err) {
      next(err);
    }
  }

  async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id'] as string, 10);
      const parsed = UpdateTodoSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Validation error';
        const err = new Error(message) as Error & { statusCode: number };
        err.statusCode = 400;
        return next(err);
      }
      const todo = await service.update(id, parsed.data);
      res.json(todo);
    } catch (err) {
      next(err);
    }
  }

  async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id'] as string, 10);
      await service.remove(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  return { getAll, create, update, remove };
}
