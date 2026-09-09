---
name: cPanel Fileman deployment behavior
description: Host-specific Fileman, LiteSpeed, and phpMyAdmin behaviors that can make a reported-success deployment incomplete.
---

Treat cPanel Fileman operation success as provisional. Archive extraction can report success while leaving an existing target file unchanged. Uploads can also preserve a restrictive local mode such as `0600`, which makes LiteSpeed return `403` for PHP files.

**Why:** A production repair appeared extracted but the live file retained its old byte size. One-time PHP runners uploaded with `0600` were blocked even when their paths and contents were valid.

**How to apply:** After every upload or extraction, verify the live file by byte size or hash and check the HTTP response. Use `0644` for web-readable PHP/static files. Never remove the working file until a rollback copy exists.

On this host, phpMyAdmin's file-import form can incorrectly reject a tiny SQL file as too large, while the authenticated SQL editor form accepts the same reviewed SQL.

**Why:** The upload layer failed before executing any SQL, but submitting the exact migration text through the authenticated SQL form succeeded.

**How to apply:** Confirm the target database and exact SQL before form submission, then verify the resulting schema through application endpoints. Do not treat an HTTP `200` alone as SQL success.

The installed Fileman UAPI does not expose the newer single-file deletion call. Its legacy API 2 file operation with `trash` is the supported reversible cleanup path.

**Why:** Calls to the newer endpoint returned “function not found,” while the legacy trash operation removed temporary files successfully.

**How to apply:** Prefer moving temporary deployment files to trash over permanent deletion, and confirm they are absent from the document root afterward.

This account rejects cPanel UAPI Basic Authentication with HTTP 401 even when the same username and password successfully authenticate in the cPanel browser UI.

**Why:** Direct Fileman UAPI calls failed before reaching the operation, while the authorized browser session completed upload, overwrite, extraction, and verification.

**How to apply:** Do not diagnose the stored cPanel credentials as invalid from a UAPI 401 alone. Use the browser UI for this host and retain the backup-first, explicit-overwrite, size-check workflow.