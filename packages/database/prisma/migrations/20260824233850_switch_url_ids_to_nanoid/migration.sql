-- This is an empty migration.

-- Data backfill: rewrite existing ids of the URL-facing models to nanoid-style
-- (12-char URL-safe) values. All Prisma FK constraints already use
-- ON UPDATE CASCADE, so each PK update propagates to every referencing table.

-- Safety: abort if any FK referencing these tables is not ON UPDATE CASCADE.
DO $$
DECLARE c TEXT;
BEGIN
  SELECT con.conname INTO c
  FROM pg_constraint con
  JOIN pg_class child ON child.oid = con.conrelid
  JOIN pg_class parent ON parent.oid = con.confrelid
  JOIN pg_namespace ns ON ns.oid = child.relnamespace
  WHERE con.contype = 'f'
    AND con.confupdtype <> 'c'
    AND ns.nspname = 'public'
    AND parent.relname IN ('Organization', 'Student', 'StudentImport', 'TeacherProfile', 'Subject', 'Level', 'LearningClass', 'Room', 'ClassSession', 'Invoice', 'Payment')
  LIMIT 1;

  IF c IS NOT NULL THEN
    RAISE EXCEPTION 'FK % does not use ON UPDATE CASCADE; aborting backfill', c;
  END IF;
END $$;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Organization"
)
UPDATE "Organization" SET id = ids.new_id FROM ids WHERE "Organization".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Student"
)
UPDATE "Student" SET id = ids.new_id FROM ids WHERE "Student".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "StudentImport"
)
UPDATE "StudentImport" SET id = ids.new_id FROM ids WHERE "StudentImport".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "TeacherProfile"
)
UPDATE "TeacherProfile" SET id = ids.new_id FROM ids WHERE "TeacherProfile".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Subject"
)
UPDATE "Subject" SET id = ids.new_id FROM ids WHERE "Subject".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Level"
)
UPDATE "Level" SET id = ids.new_id FROM ids WHERE "Level".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "LearningClass"
)
UPDATE "LearningClass" SET id = ids.new_id FROM ids WHERE "LearningClass".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Room"
)
UPDATE "Room" SET id = ids.new_id FROM ids WHERE "Room".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "ClassSession"
)
UPDATE "ClassSession" SET id = ids.new_id FROM ids WHERE "ClassSession".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Invoice"
)
UPDATE "Invoice" SET id = ids.new_id FROM ids WHERE "Invoice".id = ids.old_id;

WITH ids AS (
  SELECT id AS old_id, left(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), 12) AS new_id
  FROM "Payment"
)
UPDATE "Payment" SET id = ids.new_id FROM ids WHERE "Payment".id = ids.old_id;

-- Final sanity: every subset row must have a unique, well-formed nanoid(12).
DO $$
DECLARE
  t TEXT;
  total BIGINT;
  ok    BIGINT;
BEGIN
  FOREACH t IN ARRAY ARRAY['Organization', 'Student', 'StudentImport', 'TeacherProfile', 'Subject', 'Level', 'LearningClass', 'Room', 'ClassSession', 'Invoice', 'Payment']
  LOOP
    EXECUTE format('SELECT count(*), count(DISTINCT id) FROM %I', t) INTO total, ok;
    IF total <> ok THEN
      RAISE EXCEPTION 'id collision in %: % rows, % distinct', t, total, ok;
    END IF;
    EXECUTE format('SELECT count(*) FROM %I WHERE id ~ ''^[A-Za-z0-9_-]{12}$''', t) INTO ok;
    IF total <> ok THEN
      RAISE EXCEPTION 'id not a 12-char nanoid in %: % rows, % valid', t, total, ok;
    END IF;
  END LOOP;
END $$;