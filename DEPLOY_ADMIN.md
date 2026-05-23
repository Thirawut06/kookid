# Admin deployment checklist

This app now expects admin access to be handled server-side.

## 1) Update local `.env`

Keep only browser-safe values in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ENABLE_ADMIN=true` only if you want the `/admin` route included in the client build

Do **not** store these secrets in the browser bundle or commit them:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

For local serverless testing, put those secrets in the environment used by your serverless runtime or `vercel dev`, not in a client file.

## 2) Supabase setup

1. Open your Supabase project.
2. Make sure Row Level Security is enabled on the tables used by admin data.
3. Keep public/client access limited to the anon/publishable key.
4. Do not expose the service role key to the browser.

The admin endpoints read data with the service role key on the server only.

## 3) Vercel setup

Add these environment variables in Vercel Project Settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`
- `VITE_ENABLE_ADMIN=true`

If you want a stop-gap protection for the admin route, you have two options:

- Host-level (recommended for quick staging): use your hosting provider's password protection or Basic Auth feature (e.g., Vercel Password Protection / password-protected deployments) and set `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASSWORD` there.
- App-level (already implemented): we protect sensitive data via `/api/admin/login` and `/api/admin/data` which require `ADMIN_PASSWORD` and a server-issued token. This is active by default and does not rely on any middleware.

Then redeploy.

## 4) Verify the admin flow

1. Open `/admin` on the deployed site.
2. Enter the admin password.
3. Confirm the dashboard loads data from `/api/admin/data`.
4. If login fails, check the server logs for `/api/admin/login` and `/api/admin/data`.

## 5) Rotate the exposed token

If `VITE_ADMIN_TOKEN` was ever used in a public build, rotate it now. Client-side tokens are not secure.
