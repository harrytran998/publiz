import { withTimestamps } from "../sql";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("organizations")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("slug", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("logo_url", "text")
    .addColumn("cover_url", "text")
    .addColumn("owner_id", "integer", (col) =>
      col.references("users.id").onDelete("set null")
    )
    .$call(withTimestamps)
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("organizations").execute();
}
