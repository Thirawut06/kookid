Run the SQL in `supabase/schema.sql` using the Supabase SQL editor or psql.

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
- `schema.sql` enables minimal RLS policies granting public insert/select for MVP; review before production.
- The `pgcrypto` extension is required for `gen_random_uuid()`.
