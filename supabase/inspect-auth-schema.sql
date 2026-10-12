-- Read-only inspection. Run this if the migration's preflight stops.
select column_name, data_type, udt_schema, udt_name, is_nullable, column_default
from information_schema.columns where table_schema = 'public' and table_name = 'profiles';
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = to_regclass('public.profiles');
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'profiles';
select n.nspname, c.relname, t.tgname, pg_get_triggerdef(t.oid), pg_get_functiondef(t.tgfoid)
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal and (t.tgrelid = 'auth.users'::regclass or t.tgrelid = to_regclass('public.profiles'));
select n.nspname, t.typname, e.enumlabel from pg_type t
join pg_namespace n on n.oid = t.typnamespace join pg_enum e on e.enumtypid = t.oid
where n.nspname = 'public' order by t.typname, e.enumsortorder;
