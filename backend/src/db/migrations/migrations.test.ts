import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { type Knex } from 'knex';
import path from 'path';
import { VitestMigrationSource } from '../VitestMigrationSource';

let db: Knex;
const migrationSource = new VitestMigrationSource(path.join(__dirname));

beforeAll(async () => {
  db = knex({
    client: 'better-sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
  });
  await db.migrate.latest({ migrationSource });
});

afterAll(async () => {
  await db.destroy();
});

describe('Migration: 20260329120000_create_todos', () => {
  it('creates the todos table', async () => {
    const exists = await db.schema.hasTable('todos');
    expect(exists).toBe(true);
  });

  it('has the correct columns', async () => {
    const cols = await db('todos').columnInfo();
    expect(cols).toHaveProperty('id');
    expect(cols).toHaveProperty('text');
    expect(cols).toHaveProperty('completed');
    expect(cols).toHaveProperty('user_id');
    expect(cols).toHaveProperty('created_at');
    expect(cols).toHaveProperty('updated_at');
  });

  it('completed defaults to 0 (false)', async () => {
    const [id] = await db('todos').insert({ text: 'test default' });
    const row = await db('todos').where({ id }).first();
    expect(row.completed).toBe(0);
    await db('todos').where({ id }).delete();
  });

  it('created_at and updated_at are set automatically', async () => {
    const [id] = await db('todos').insert({ text: 'timestamps test' });
    const row = await db('todos').where({ id }).first();
    expect(row.created_at).toBeTruthy();
    expect(row.updated_at).toBeTruthy();
    await db('todos').where({ id }).delete();
  });

  it('user_id accepts NULL', async () => {
    const [id] = await db('todos').insert({ text: 'null user_id', user_id: null });
    const row = await db('todos').where({ id }).first();
    expect(row.user_id).toBeNull();
    await db('todos').where({ id }).delete();
  });

  it('is idempotent — running migrate:latest again causes no error', async () => {
    await expect(db.migrate.latest({ migrationSource })).resolves.not.toThrow();
  });
});
