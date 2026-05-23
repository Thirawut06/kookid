# Post-migration checklist

Use this after running `supabase/schema.sql` in Supabase.

## 1) Confirm the live schema

Run `supabase/inspect_current_state.sql` in the Supabase SQL Editor.

Check that:

- `user_profiles` exists with the expected columns:
  - `id`
  - `nickname`
  - `user_type`
  - `grade_and_school`
  - `contact`
  - `email`
  - `line_id`
  - `education_level`
  - `school_province`
  - `consent_accepted`
  - `consent_at`
  - `created_at`
  - `updated_at`
- `quiz_results` exists and has the unique constraint on `user_profile_id`
- `program_interests` has `university_id`
- `career_feedback` exists
- `event_logs` exists

## 2) Confirm RLS and policies

Check that:

- RLS is enabled on all five tables
- Public `select` policies are gone from:
  - `user_profiles`
  - `quiz_results`
  - `program_interests`
  - `event_logs`
- Public `insert` still exists on the tables the app writes to

## 3) Test the app flow

In the app, do this in order:

1. Open the landing page.
2. Start the quiz and finish it.
3. Save lead capture with real sample values.
4. Open a result page and verify no console errors.
5. Trigger a program interest action.
6. Trigger a feedback action if you use it in your flow.

## 4) Verify data was saved

After the test flow, in Supabase:

- `user_profiles` should contain the new profile row
- `quiz_results` should contain the linked quiz result row
- `program_interests` should contain the selected major row
- `event_logs` should contain the tracked events

## 5) Verify admin

Open `/admin` and confirm:

- login still works
- the dashboard loads data
- filters and CSV exports still work

## 6) If something breaks

- If inserts fail, check the table policy on that table first.
- If admin fails, check Vercel env vars and the `/api/admin/login` / `/api/admin/data` logs.
- If the app complains about missing columns, re-run `supabase/schema.sql` once more.
