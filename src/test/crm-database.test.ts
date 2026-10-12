// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated;
    create schema firstroot_private;
    grant usage on schema firstroot_private to authenticated;
    create function firstroot_private.is_admin() returns boolean language sql stable as
      $$ select current_setting('test.admin', true) = 'yes' $$;
    create table public.profiles (id uuid primary key);
    create function public.set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at := now(); return new; end $$;
  `);
  await db.exec(readFileSync("supabase/migrations/202610120001_crm.sql", "utf8"));
}, 60000);
afterAll(async () => {
  await db?.close();
});

it("permits admins to manage CRM contacts and notes, but hides them from customers", async () => {
  await db.exec(`set role authenticated; set "test.admin" = 'yes';`);
  const { rows } = await db.query<{ id: string }>(
    "insert into crm_contacts(name) values ('Lead') returning id",
  );
  const id = rows[0]!.id;
  await db.query("insert into crm_notes(contact_id,body) values ($1,$2)", [
    id,
    "Called about hair oil",
  ]);
  await db.query("update crm_contacts set stage = 'Qualified' where id = $1", [id]);
  expect((await db.query("select * from crm_contacts")).rows).toHaveLength(1);
  await db.exec(`set "test.admin" = 'no';`);
  expect((await db.query("select * from crm_contacts")).rows).toHaveLength(0);
  expect((await db.query("select * from crm_notes")).rows).toHaveLength(0);
  await expect(db.query("insert into crm_contacts(name) values ('Forbidden')")).rejects.toThrow();
  await db.query("update crm_contacts set stage = 'Won' where id = $1", [id]);
  await db.exec(`set "test.admin" = 'yes';`);
  expect((await db.query<{ stage: string }>("select stage from crm_contacts")).rows[0]!.stage).toBe(
    "Qualified",
  );
  await db.query("delete from crm_contacts where id = $1", [id]);
  expect((await db.query("select * from crm_notes")).rows).toHaveLength(0);
});

it("rejects invalid stages, negative values, and blank names", async () => {
  await expect(
    db.query("insert into crm_contacts(name,stage) values ('Lead','Invalid')"),
  ).rejects.toThrow();
  await expect(
    db.query("insert into crm_contacts(name,value) values ('Lead',-1)"),
  ).rejects.toThrow();
  await expect(db.query("insert into crm_contacts(name) values ('   ')")).rejects.toThrow();
});
