import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { Router, type IRouter, type Request, type RequestHandler } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ChangePasswordBody,
  SessionLoginBody,
  SessionLoginResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const scrypt = promisify(scryptCallback);
const cookieName = "infocrm_session";

const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
};

const verifyPassword = async (password: string, stored: string) => {
  const [algorithm, saltHex, expectedHex] = stored.split(":");
  if (algorithm !== "scrypt" || !saltHex || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const secret = () => process.env.SESSION_SECRET;
const passwordVersion = (hash: string) => createHash("sha256").update(hash).digest("base64url").slice(0, 16);
const sign = (value: string, key: string) => createHmac("sha256", key).update(value).digest("base64url");

const issueToken = (user: typeof usersTable.$inferSelect, key: string) => {
  const body = Buffer.from(JSON.stringify({
    userId: user.id,
    passwordVersion: passwordVersion(user.passwordHash),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  })).toString("base64url");
  return `${body}.${sign(body, key)}`;
};

const parseCookie = (req: Request) => {
  const entry = req.headers.cookie?.split(";").map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : null;
};

const authenticatedUser = async (req: Request, key: string) => {
  const token = parseCookie(req);
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body, key);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      userId: number; passwordVersion: string; expiresAt: number;
    };
    if (payload.expiresAt < Date.now()) return null;
    const [user] = await db.select().from(usersTable).where(and(
      eq(usersTable.id, payload.userId),
      eq(usersTable.status, "active"),
      isNull(usersTable.deletedAt),
    ));
    return user && passwordVersion(user.passwordHash) === payload.passwordVersion ? user : null;
  } catch {
    return null;
  }
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const key = secret();
  if (!key) {
    res.status(503).json({ error: "Session authentication is not configured" });
    return;
  }
  const user = await authenticatedUser(req, key);
  if (!user) {
    res.status(401).json({ error: "Authentication required", code: "authentication_required" });
    return;
  }
  res.locals.user = user;
  next();
};

router.get("/session/users", async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    status: usersTable.status,
  }).from(usersTable).where(and(eq(usersTable.status, "active"), isNull(usersTable.deletedAt)));
  res.json(users);
});

router.get("/session/me", requireAuth, (req, res): void => {
  const user = res.locals.user as typeof usersTable.$inferSelect;
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
  });
});

router.post("/session/login", async (req, res): Promise<void> => {
  const key = secret();
  if (!key) {
    res.status(503).json({ error: "Session authentication is not configured" });
    return;
  }
  const parsed = SessionLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(and(
    eq(usersTable.username, parsed.data.username),
    eq(usersTable.status, "active"),
    isNull(usersTable.deletedAt),
  ));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
  res.cookie(cookieName, issueToken(user, key), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000, path: "/api",
  });
  res.json(SessionLoginResponse.parse({
    id: user.id, username: user.username, displayName: user.displayName,
    workplaceId: user.workplaceId, groupId: user.groupId, status: "active",
  }));
});

router.post("/session/logout", (_req, res): void => {
  res.clearCookie(cookieName, { path: "/api" });
  res.sendStatus(204);
});

router.post("/session/password", async (req, res): Promise<void> => {
  const key = secret();
  if (!key) {
    res.status(503).json({ error: "Session authentication is not configured" });
    return;
  }
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await authenticatedUser(req, key);
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Authentication failed" });
    return;
  }
  await db.update(usersTable).set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(usersTable.id, user.id));
  res.clearCookie(cookieName, { path: "/api" });
  res.sendStatus(204);
});

export default router;