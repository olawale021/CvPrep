# Database Migrations

This directory contains database migration files for setting up and updating the Supabase database schema.

## Applying Migrations

You can apply these migrations in the Supabase dashboard using the SQL Editor:

1. Log in to your Supabase project dashboard at https://app.supabase.com
2. Go to the SQL Editor section
3. Create a "New Query"
4. Copy and paste the content of the migration file (e.g., `migrations/google_id_column.sql`)
5. Click "Run" to execute the SQL

## Important Migrations

- `google_id_column.sql`: Creates the users table if it doesn't exist and adds a `google_id` column to store the original OAuth provider ID, separate from the UUID primary key.
- `user_rls_policy.sql`: Creates Row Level Security policies for the users table to allow operations with the anonymous API key.
- `migrate_oauth_id_to_google_id.sql`: If you previously used the `oauth_id` column, this script will migrate data to the `google_id` column.

## Migration Order

If applying these migrations from scratch:
1. First run `google_id_column.sql` to create the table structure
2. Then run `user_rls_policy.sql` to set up security policies
3. Only if needed, run `migrate_oauth_id_to_google_id.sql` to migrate data from an older column name

## Database Schema

The application uses the following table structure:

### Users Table

- `id` (UUID, Primary Key): UUID format identifier used as the primary key
- `google_id` (TEXT): Original ID from the OAuth provider (e.g., Google)
- `email` (TEXT, Unique): User's email address
- `full_name` (TEXT): User's full name
- `profile_picture` (TEXT): URL to the user's profile picture
- `auth_provider` (TEXT): Authentication provider (e.g., 'google')
- `is_active` (BOOLEAN): Whether the user account is active
- `is_verified` (BOOLEAN): Whether the user's email is verified
- `last_login` (TIMESTAMP): When the user last logged in
- `created_at` (TIMESTAMP): When the user account was created 