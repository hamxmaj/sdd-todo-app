import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('todos', (table) => {
    table.increments('id').primary();
    table.text('text').notNullable().checkLength('>=', 1).checkLength('<=', 500);
    table.boolean('completed').notNullable().defaultTo(false);
    table.integer('user_id').nullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('todos');
}
