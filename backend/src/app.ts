import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Knex } from 'knex';
import { errorHandler } from './middleware/errorHandler';
import { createTodoRouter } from './routes/todoRoutes';
import { createTodoService } from './services/todoService';

export function createApp(db: Knex) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const todoService = createTodoService(db);
  app.use('/api/todos', createTodoRouter(todoService));

  app.use(errorHandler);

  return app;
}
