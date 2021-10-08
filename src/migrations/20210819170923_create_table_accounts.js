exports.up = (knex) => {
  return knex.schema.createTable("accounts", (table) => {
    table.increments("id").primary();
    table.string("name").notNull();
    table.integer("user_id").references("id").inTable("users").notNull();
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable("accounts");
};
