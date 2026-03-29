import { Router } from 'express';
import type { TodoService } from '../services/todoService';
import { createTodoController } from '../controllers/todoController';

export function createTodoRouter(service: TodoService): Router {
  const router = Router();
  const controller = createTodoController(service);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
