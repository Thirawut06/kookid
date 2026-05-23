For a brand-new database, run `supabase/schema.sql`.

For an existing database, use the same file safely because it only adds missing tables, columns, indexes, and policies. Supabase may still show a generic warning when the SQL touches table structure, but this script does not contain any `DROP TABLE` or `DROP COLUMN` statements.

Quick steps (Supabase project UI):
1. Open your Supabase project
2. Go to "SQL" → "New query"
3. Paste the contents of `supabase/schema.sql` and run it

Using `psql` (if you have the DB connection string):

```bash
psql "postgres://user:pass@db.host:5432/postgres" -f supabase/schema.sql
```

If you use the Supabase CLI, you can also run:

```bash
supabase db query supabase/schema.sql
```

Notes:
- `schema.sql` keeps the public write flow needed by the app, but removes public read policies for sensitive tables in production-oriented setups.
- The `pgcrypto` extension is required for `gen_random_uuid()`.
- If you already have data, avoid using any "reset database" or destructive migration wizard; run the SQL as a normal query instead.