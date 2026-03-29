import type { Knex } from 'knex';
import path from 'path';

const DATABASE_PATH =
  process.env.DATABASE_PATH ?? path.join(__dirname, 'data', 'todos.db');

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: DATABASE_PATH,
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
    },
    useNullAsDefault: true,
  },
  production: {
    client: 'better-sqlite3',
    connection: {
      filename: DATABASE_PATH,
    },
    migrations: {
      directory: './dist/db/migrations',
      extension: 'js',
    },
    useNullAsDefault: true,
  },
  test: {
    client: 'better-sqlite3',
    connection: ':memory:',
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    useNullAsDefault: true,
  },
};

export default config;
