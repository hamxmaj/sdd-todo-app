import path from 'path';
import fs from 'fs';
import type { Knex } from 'knex';

/**
 * Custom Knex migration source for Vitest environments.
 * Uses dynamic import() so Vitest's own transform handles TypeScript files,
 * avoiding the Node hook / source-map conflicts that tsx/cjs causes.
 */
export class VitestMigrationSource implements Knex.MigrationSource<string> {
  private directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  getMigrations(): Promise<string[]> {
    const files = fs
      .readdirSync(this.directory)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .sort();
    return Promise.resolve(files);
  }

  getMigrationName(migration: string): string {
    return migration;
  }

  async getMigration(migration: string): Promise<Knex.Migration> {
    const fullPath = path.join(this.directory, migration);
    const mod = await import(fullPath);
    return mod as Knex.Migration;
  }
}
