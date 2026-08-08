-- Rename Student.photoUrl to Student.photoKey. The column now stores the
-- Cloudflare R2 object key for the (private) student photo rather than a
-- publicly addressable URL. Renaming preserves any existing values.

ALTER TABLE "Student" RENAME COLUMN "photoUrl" TO "photoKey";
