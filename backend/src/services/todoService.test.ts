import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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

beforeEach(async () => {
  await db('todos').delete();
});

// ─── GET /api/todos ────────────────────────────────────────────────────────────

describe('GET /api/todos', () => {
  it('returns 200 with empty array when no todos exist', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns todos with camelCase fields and boolean completed', async () => {
    await db('todos').insert({ text: 'Buy milk' });

    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    const todo = res.body[0];
    expect(todo).toMatchObject({
      id: expect.any(Number),
      text: 'Buy milk',
      completed: false,
      userId: null,
    });
    expect(typeof todo.createdAt).toBe('string');
    expect(typeof todo.updatedAt).toBe('string');
    expect(todo).not.toHaveProperty('created_at');
    expect(todo).not.toHaveProperty('updated_at');
  });

  it('returns active todos before completed todos', async () => {
    await db('todos').insert([
      { text: 'Active task', completed: 0 },
      { text: 'Done task', completed: 1 },
    ]);

    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body[0].text).toBe('Active task');
    expect(res.body[0].completed).toBe(false);
    expect(res.body[1].text).toBe('Done task');
    expect(res.body[1].completed).toBe(true);
  });

  it('orders active todos by created_at DESC (newest first)', async () => {
    await db('todos').insert({ text: 'First', created_at: '2026-01-01 00:00:00' });
    await db('todos').insert({ text: 'Second', created_at: '2026-01-02 00:00:00' });

    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body[0].text).toBe('Second');
    expect(res.body[1].text).toBe('First');
  });
});

// ─── POST /api/todos ───────────────────────────────────────────────────────────

describe('POST /api/todos', () => {
  it('creates a todo and returns 201 with the new todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: 'Buy milk' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      text: 'Buy milk',
      completed: false,
      userId: null,
    });
    expect(typeof res.body.createdAt).toBe('string');
    expect(typeof res.body.updatedAt).toBe('string');
  });

  it('returns 400 when text is blank (whitespace only)', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'Text is required',
      statusCode: 400,
    });
  });

  it('returns 400 when text is empty string', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('returns 400 when text exceeds 500 characters', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: 'a'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('trims whitespace from text before saving', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: '  Buy milk  ' });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Buy milk');
  });

  it('persists the todo in the database', async () => {
    await request(app).post('/api/todos').send({ text: 'Persisted' });

    const rows = await db('todos').select('*');
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('Persisted');
  });
});

// ─── PUT /api/todos/:id ────────────────────────────────────────────────────────

describe('PUT /api/todos/:id', () => {
  it('updates the text of a todo and returns 200', async () => {
    const [id] = await db('todos').insert({ text: 'Old text' });

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ text: 'Updated text' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, text: 'Updated text', completed: false });
    expect(typeof res.body.updatedAt).toBe('string');
  });

  it('toggles completed to true and returns 200', async () => {
    const [id] = await db('todos').insert({ text: 'Buy milk' });

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('toggles completed back to false', async () => {
    const [id] = await db('todos').insert({ text: 'Buy milk', completed: 1 });

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ completed: false });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app)
      .put('/api/todos/99999')
      .send({ text: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Todo not found', statusCode: 404 });
  });

  it('returns 400 when body is empty (nothing to update)', async () => {
    const [id] = await db('todos').insert({ text: 'Test' });

    const res = await request(app).put(`/api/todos/${id}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('returns 400 when text is blank', async () => {
    const [id] = await db('todos').insert({ text: 'Test' });

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('completed field is returned as boolean, not 0/1', async () => {
    const [id] = await db('todos').insert({ text: 'Test' });

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ completed: true });

    expect(typeof res.body.completed).toBe('boolean');
  });
});

// ─── DELETE /api/todos/:id ─────────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  it('deletes an existing todo and returns 204 with no body', async () => {
    const [id] = await db('todos').insert({ text: 'Delete me' });

    const res = await request(app).delete(`/api/todos/${id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('removes the todo from the database', async () => {
    const [id] = await db('todos').insert({ text: 'Gone' });

    await request(app).delete(`/api/todos/${id}`);

    const row = await db('todos').where({ id }).first();
    expect(row).toBeUndefined();
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/todos/99999');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Todo not found', statusCode: 404 });
  });
});
