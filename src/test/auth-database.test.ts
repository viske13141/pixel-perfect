// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/202610080001_auth_profiles.sql"),
  "utf8",
);
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000003";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to public;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    insert into auth.users (id,email,raw_user_meta_data) values
      ('${alice}', 'alice@example.com', '{"full_name":"Alice","role":"ADMIN"}');
  `);
  await db.exec(migration);
  await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values
    ('${bob}', 'bob@example.com', '{"full_name":"Bob","role":"ADMIN"}'),
    ('${admin}', 'admin@example.com', '{"full_name":"Admin"}');
    update public.profiles set role = 'ADMIN' where id = '${admin}';`);
}, 60000);
afterAll(async () => {
  await db?.close();
});

async function asUser<T>(id: string, work: () => Promise<T>) {
  await db.exec(
    `begin; set local role authenticated; set local "request.jwt.claim.sub" = '${id}';`,
  );
  try {
    return await work();
  } finally {
    await db.exec("rollback;");
  }
}
describe("Actual PostgreSQL profile migration and RLS", () => {
  it("backfills old users and ignores forged metadata roles on new signups", async () => {
    const { rows } = await db.query<{ role: string }>(
      "select role from profiles where id in ($1,$2)",
      [alice, bob],
    );
    expect(rows.map((row) => row.role)).toEqual(["CUSTOMER", "CUSTOMER"]);
  });
  it("allows customers to read only their own profile without recursion", async () => {
    await asUser(alice, async () => {
      const { rows } = await db.query<{ id: string }>("select id from profiles");
      expect(rows).toEqual([{ id: alice }]);
    });
  });
  it("allows admins to read customer profiles", async () => {
    await asUser(admin, async () => {
      const { rows } = await db.query("select id from profiles");
      expect(rows).toHaveLength(3);
    });
  });
  it("permits personal-field changes and updates the timestamp", async () => {
    await asUser(alice, async () => {
      const { rows } = await db.query<{ full_name: string; mobile: string; updated_at: string }>(
        "update profiles set full_name='Updated',mobile='9876543210' where id=$1 returning full_name,mobile,updated_at",
        [alice],
      );
      expect(rows[0]).toMatchObject({ full_name: "Updated", mobile: "9876543210" });
      expect(rows[0]?.updated_at).toBeTruthy();
    });
  });
  it.each(["role='ADMIN'", `id='${bob}'`, "email='other@example.com'", "created_at=now()"])(
    "denies privileged mutation: %s",
    async (assignment) => {
      await expect(
        asUser(alice, () => db.exec(`update profiles set ${assignment} where id='${alice}'`)),
      ).rejects.toThrow(/permission denied/);
    },
  );
  it("cannot edit another customer's personal fields", async () => {
    await asUser(alice, async () => {
      const { rows } = await db.query(
        "update profiles set full_name='Hacked' where id=$1 returning id",
        [bob],
      );
      expect(rows).toHaveLength(0);
    });
  });
  it("denies direct inserts and deletes", async () => {
    await expect(
      asUser(alice, () =>
        db.exec(
          `insert into profiles(id,role) values ('00000000-0000-4000-8000-000000000009','ADMIN')`,
        ),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(asUser(alice, () => db.exec("delete from profiles"))).rejects.toThrow(
      /permission denied/,
    );
  });
  it("grants anonymous users no profile access", async () => {
    await db.exec("begin; set local role anon;");
    try {
      await expect(db.exec("select * from profiles")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("rollback;");
    }
  });
  it("blocks self-promotion even after an accidental broad update grant", async () => {
    await db.exec(
      `begin; grant update on profiles to authenticated; set local role authenticated; set local "request.jwt.claim.sub"='${alice}';`,
    );
    try {
      await expect(db.exec(`update profiles set role='ADMIN' where id='${alice}'`)).rejects.toThrow(
        /Privileged profile fields/,
      );
    } finally {
      await db.exec("rollback;");
    }
  });
  it("syncs auth email without changing the role", async () => {
    await db.exec("begin;");
    try {
      await db.query("update auth.users set email='new@example.com' where id=$1", [alice]);
      const { rows } = await db.query("select email,role from profiles where id=$1", [alice]);
      expect(rows[0]).toEqual({ email: "new@example.com", role: "CUSTOMER" });
    } finally {
      await db.exec("rollback;");
    }
  });
  it("can run twice without duplicate profiles or downgrading authorized admins", async () => {
    await db.exec(migration);
    const { rows } = await db.query("select role from profiles where id=$1", [admin]);
    expect(rows[0]).toEqual({ role: "ADMIN" });
    expect((await db.query("select * from profiles")).rows).toHaveLength(3);
  });
  it("stops safely on an unfamiliar existing profiles schema", async () => {
    await db.exec("comment on table profiles is 'unfamiliar existing schema';");
    try {
      await expect(db.exec(migration)).rejects.toThrow(/requires inspection/);
    } finally {
      await db.exec("rollback; comment on table profiles is '1st ROOT auth profiles v1';");
    }
  });
});
