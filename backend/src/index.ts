import 'dotenv/config';
import db from './db/knex';
import { createApp } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function start(): Promise<void> {
  await db.migrate.latest();
  console.log('Migrations complete');

  const app = createApp(db);
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
