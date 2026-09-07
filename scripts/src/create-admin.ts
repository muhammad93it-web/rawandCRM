/**
 * Creates the first administrator account for the Replit development database.
 *
 * Mirrors the PHP release's `/session/bootstrap` endpoint (deploy/cpanel/app/generic.php):
 * a plain active user, no workplace or group, whose password is stored in the same
 * scrypt format that artifacts/api-server/src/routes/auth.ts verifies.
 *
 * Usage (the password must come from a Replit Secret, never from the command line):
 *   pnpm --filter @workspace/scripts run create-admin
 *   pnpm --filter @workspace/scripts run create-admin -- --reset-password
 *
 * Environment:
 *   ADMIN_PASSWORD      required, at least 8 characters (Replit Secret)
 *   ADMIN_USERNAME      optional, defaults to "admin"
 *   ADMIN_DISPLAY_NAME  optional, defaults to "بەڕێوەبەر"
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, isNull } from "drizzle-orm";
import { db, pool, usersTable } from "@workspace/db";

const scrypt = promisify(scryptCallback);

const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
};

const main = async () => {
  const username = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const displayName = (process.env.ADMIN_DISPLAY_NAME ?? "بەڕێوەبەر").trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const resetPassword = process.argv.includes("--reset-password");

  if (username === "") throw new Error("ADMIN_USERNAME must not be empty.");
  if (displayName === "") throw new Error("ADMIN_DISPLAY_NAME must not be empty.");
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be set as a Replit Secret and be at least 8 characters long.");
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, username), isNull(usersTable.deletedAt)))
    .limit(1);

  const passwordHash = await hashPassword(password);

  if (existing) {
    if (!resetPassword) {
      throw new Error(`User "${username}" already exists. Re-run with --reset-password to replace its password.`);
    }
    await db.update(usersTable).set({ passwordHash, status: "active" }).where(eq(usersTable.id, existing.id));
    console.log(`Password reset for user "${username}" (id ${existing.id}).`);
    return;
  }

  const [created] = await db
    .insert(usersTable)
    .values({ username, displayName, passwordHash, status: "active" })
    .returning({ id: usersTable.id });
  console.log(`Created administrator "${username}" (id ${created.id}).`);
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
