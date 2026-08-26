-- Restore USAGE on schema public for anon/authenticated so PostgREST can
-- resolve and execute the username RPC functions (is_username_available,
-- get_email_by_username). The "Revoke Public" hardening removed schema USAGE;
-- without it PostgREST rejects the RPC (42501), which the auth pages
-- misreport as "Username already taken" / "Invalid email or username".
-- Object-level privileges are unchanged: anon/authenticated still have no
-- table grants in public and only the explicitly-granted functions above.

-- GrantUsage
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";