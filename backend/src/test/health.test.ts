import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import knex, { type Knex } from 'knex';
import path from 'path';
import { createApp } from '../app';
import { VitestMigrationSource } from '../db/VitestMigrationSource';

let db: Knex;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = knex({ client: 'better-sqlite3', connection: ':memory:', useNullAsDefault: true });
  await db.migrate.latest({
    migrationSource: new VitestMigrationSource(
      path.join(__dirname, '../db/migrations'),
    ),
  });
  app = createApp(db);
});

afterAll(async () => {
  await db.destroy();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
