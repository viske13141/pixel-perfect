# Pixel Perfect

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4f422beb-bc82-4b26-9d8d-7bdb097b40da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Supabase connection

The app is configured for `ydquzcxpkxoukfzneqre` in `.env`. It uses the public
publishable key; a legacy anon key is not also required. Never put a service-role
or secret key in a `VITE_` variable.

Customer and Admin use the same `/register` and `/login` pages. Roles are read
from the protected `profiles` table; signup metadata never grants privileges.
Keep email confirmation **disabled**. Customers go to `/account`; Admins go to
`/admin`. Both route trees require the appropriate authenticated role.

**Manual setup is required:** run [the complete SQL migration](supabase/migrations/202610080001_auth_profiles.sql)
in Supabase SQL Editor. The script creates profiles, backfills existing users,
and installs RLS, restricted column grants, and triggers. It aborts safely on
unfamiliar existing profile objects. No hosted database migration has been run.

Public registration creates CUSTOMER accounts only. Immediate Admin registration
is an opt-in local-development feature protected by a server-held secret and an
expiring Edge Function configuration. The UI switch is not authorization.

See [authentication setup and testing](docs/authentication.md) for the complete
Admin bootstrap, configuration, testing checklist, and deployment instructions.
The unrelated product/order data and profile-edit/password-change demos remain
unchanged. Authentication and dashboard access are real; commerce is still demo data.
