# Customer and Admin authentication

## What is implemented

The existing Supabase browser client and authentication service are reused.
One registration form defaults to Customer and has an Admin selector. One login
form handles both roles. Signup does not implement confirmation email or approval.
Registration only succeeds once a real session and valid database profile exist.

The context exposes `user` (the existing UI identity shape), `session`, `profile`,
`role`, `loading`, `signUp`, `signIn`, `signOut`, `error`, and `refreshProfile`.
Legacy `login/register/logout/isLoading` names remain aliases for existing UI.
Auth events are deferred outside Supabase's callback lock, and stale profile
requests cannot restore a role after sign-out. Sessions persist through the SDK.

Both parent routes are guarded, including every nested route. ADMIN goes to
`/admin`, CUSTOMER goes to `/account`; visiting the other role's dashboard redirects
to your own. Missing profiles show an error and retry/sign-out controls, not a
fallback role. Anonymous visitors go to `/login`.

## Apply the database migration manually

1. In Supabase SQL Editor, run all of
   [`202610080001_auth_profiles.sql`](../supabase/migrations/202610080001_auth_profiles.sql).
2. If its preflight rejects existing objects, run
   [`inspect-auth-schema.sql`](../supabase/inspect-auth-schema.sql) and reconcile the
   existing schema before rerunning. Do not remove the guard just to force it through.
3. Confirm `public.profiles` exists and earlier Auth users have CUSTOMER profiles.

The live read-only inspection reported `PGRST205` for `public.profiles` and confirmed
`mailer_autoconfirm: true`. Public keys cannot inspect PostgreSQL catalogs, enums,
or trigger definitions. SQL checks for unfamiliar tables, policies, and triggers
inside its transaction before making changes. An existing role enum is left alone;
this table uses a TEXT CHECK constraint. No destructive DROP statements are used.

The trigger always creates CUSTOMER profiles, even if metadata says ADMIN. Role
changes require the database owner or server-only service role. Customers can read
their own profile and update only `full_name` and `mobile`. Email is owned by Auth
and synchronized by a trigger. IDs, roles and creation timestamps cannot be edited
by clients. Admins can read customer profiles. Anonymous users get no access.
The admin policy helper is SECURITY DEFINER in a private schema with a fixed
search path; it avoids recursive RLS and checks only the caller's `auth.uid()`.

Reference: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [auth callback behavior](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

## First Admin: manual development bootstrap

No Edge Function is needed for this option:

1. Register as Customer using `/register`.
2. Copy that exact user's UUID from Supabase **Authentication > Users**.
3. Run the optional owner-only bootstrap block at the end of the migration with
   the UUID substituted. It performs a direct SQL role grant, not an approval workflow.
4. Log out and log in through `/login`. The database role now sends you to `/admin`.

Never grant privileges based only on a user-provided email or signup metadata.
Existing users retain their assigned roles if the migration is run again.

## Immediate Admin registration from the same form (development only)

Use a development Supabase project. This feature is disabled by default and is
not intended to be enabled for a public production application.

1. Run the SQL migration.
2. Copy `supabase/.env.bootstrap.example` to `supabase/.env.bootstrap.local`
   (ignored by Git). Set `DEV_ADMIN_REGISTRATION_ENABLED=true`.
3. Set a cryptographically random secret of at least 32 characters. For example,
   generate one locally with Node's `crypto.randomBytes(32).toString('hex')`.
   Set the exact local origin (including port) and a short-lived future ISO UTC
   `DEV_ADMIN_EXPIRES_AT` timestamp. The server rejects expired configuration.
4. Authenticate the Supabase CLI as the project owner, then run:

   ```sh
   supabase secrets set --env-file supabase/.env.bootstrap.local --project-ref ydquzcxpkxoukfzneqre
   supabase functions deploy register-dev-admin --project-ref ydquzcxpkxoukfzneqre
   ```

   The function uses the built-in server-only `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`. Neither belongs in browser environment variables.
   `verify_jwt=false` is intentional: signup has no session, so the handler checks
   the bootstrap secret instead. Origin checks alone are never treated as authorization.

5. Put `VITE_ENABLE_DEV_ADMIN_REGISTRATION=true` in `.env.local` and restart
   `npm run dev`. This switch is ignored by production builds.
6. Select **Register as Admin**, enter the usual registration fields plus the
   bootstrap secret, and submit. The secret is held only in component memory and
   is never placed in user metadata, database profiles, or localStorage.
7. The function creates the Auth user, the trigger creates the CUSTOMER profile,
   and the server grants ADMIN before reporting success. The browser signs in
   with the submitted credentials and verifies the actual profile role.
8. Disable the function after use:

   ```sh
   supabase secrets set DEV_ADMIN_REGISTRATION_ENABLED=false --project-ref ydquzcxpkxoukfzneqre
   ```

   Remove the local UI flag as well. The configured expiry is an additional cutoff.

The endpoint cannot promote existing accounts. A duplicate email returns an error.
If role assignment fails it deletes only the Auth user created by that request.
If cleanup also fails, it explicitly reports the failure for owner investigation.

## Supabase configuration

- Keep Email provider enabled, signups allowed, and **Confirm email disabled**.
- Keep the Data API enabled with `public` exposed. Do not expose `firstroot_private`.
- Use the existing project URL and publishable key in `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`; set these for the hosting build too.
- Set the Site URL to the deployed website. This password-only flow does not need
  confirmation callbacks or OAuth redirect configuration.
- Do not enable development Admin registration in production.

## Verification

Run `npm test`, `npx tsc --noEmit`, and `npm run build`.

Tests cover service validation, duplicate accounts, invalid credentials, role lookup,
missing profile/role/session, production Admin denial, bootstrap authorization,
cleanup, both route guards, session restoration/expiration, and logout.
The migration is executed against a local embedded PostgreSQL engine (PGlite),
including real RLS/column-grant tests, forged-role metadata, old-user backfill,
privilege mutation attempts, email sync, and safe reruns. This does not migrate
or test against the hosted Supabase database.

After applying SQL and deploying the optional development function, verify with
two test accounts on your own project: Customer registration/login/refresh/logout,
Admin authorized registration/login/refresh/logout, Customer visiting `/admin`,
Admin visiting `/account`, and direct API attempts to update `profiles.role`.
No hosted test users were created by Codex and no Edge Function was deployed.

Existing unrelated TypeScript errors in `AdminCommercePages.tsx` and
`adminMockData.ts` are outside this authentication change. Product, inventory,
order, payment, shipping, review, report, cart, and checkout behavior is untouched.
Existing profile-edit and password-change demos are not upgraded by this task.
