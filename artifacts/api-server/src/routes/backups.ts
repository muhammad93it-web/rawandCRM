import { randomUUID } from "node:crypto";
import { Router, type IRouter, type RequestHandler } from "express";
import { and, desc, eq, lte } from "drizzle-orm";
import {
  backupJobsTable,
  backupSettingsTable,
  db,
  groupsTable,
  maintenanceLocksTable,
  telegramDeliveryAttemptsTable,
} from "@workspace/db";
import { executeBackup, verifyBackupArchive } from "../lib/backups";

const router: IRouter = Router();

const requireBackupAdmin: RequestHandler = async (_req, res, next) => {
  const user = res.locals.user as { id: number; username: string; groupId: number | null };
  if (user.username === "admin") { next(); return; }
  const [group] = user.groupId
    ? await db.select({ permissions: groupsTable.permissions }).from(groupsTable).where(eq(groupsTable.id, user.groupId))
    : [];
  if (group?.permissions.some((permission) => permission === "*" || permission === "backups.manage")) {
    next();
    return;
  }
  res.status(403).json({ error: "Administrator permission is required", code: "permission_denied" });
};

router.use("/admin/backups", requireBackupAdmin);

router.get("/admin/backups", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(backupJobsTable).orderBy(desc(backupJobsTable.createdAt)).limit(50);
  const attempts = await db.select().from(telegramDeliveryAttemptsTable)
    .orderBy(desc(telegramDeliveryAttemptsTable.attemptedAt)).limit(100);
  res.json(jobs.map((job) => ({
    ...job,
    telegramAttempts: attempts.filter((attempt) => attempt.backupJobId === job.id),
  })));
});

router.get("/admin/backups/status", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(backupSettingsTable).where(eq(backupSettingsTable.id, 1));
  res.json({
    timezone: "Asia/Baghdad",
    encryptionConfigured: Boolean(process.env.BACKUP_ENCRYPTION_KEY),
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    schedule: settings ?? {
      id: 1, enabled: false, frequency: "daily", localTime: "02:00",
      dayOfWeek: null, dayOfMonth: null, customCron: null,
      timezone: "Asia/Baghdad", retentionCount: 14, updatedBy: null, updatedAt: null,
    },
  });
});

router.put("/admin/backups/settings", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const frequency = String(body.frequency ?? "");
  const localTime = String(body.localTime ?? "");
  const retentionCount = Number(body.retentionCount);
  const dayOfWeek = body.dayOfWeek == null ? null : Number(body.dayOfWeek);
  const dayOfMonth = body.dayOfMonth == null ? null : Number(body.dayOfMonth);
  const customCron = body.customCron == null ? null : String(body.customCron);
  if (!["daily", "weekly", "monthly", "custom"].includes(frequency)
    || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(localTime)
    || !Number.isInteger(retentionCount) || retentionCount < 1 || retentionCount > 365
    || (frequency === "weekly" && (!Number.isInteger(dayOfWeek) || dayOfWeek! < 0 || dayOfWeek! > 6))
    || (frequency === "monthly" && (!Number.isInteger(dayOfMonth) || dayOfMonth! < 1 || dayOfMonth! > 31))
    || (frequency === "custom" && (!customCron || customCron.length > 100 || customCron.trim().split(/\s+/).length !== 5))) {
    res.status(400).json({ error: "Invalid backup schedule" }); return;
  }
  const values = {
    id: 1,
    enabled: body.enabled === true,
    frequency,
    localTime,
    dayOfWeek,
    dayOfMonth,
    customCron,
    timezone: "Asia/Baghdad",
    retentionCount,
    updatedBy: (res.locals.user as { id: number }).id,
    updatedAt: new Date(),
  };
  const [saved] = await db.insert(backupSettingsTable).values(values)
    .onConflictDoUpdate({ target: backupSettingsTable.id, set: values }).returning();
  res.json(saved);
});

router.post("/admin/backups/now", async (_req, res): Promise<void> => {
  if (!process.env.BACKUP_ENCRYPTION_KEY) {
    res.status(503).json({ error: "BACKUP_ENCRYPTION_KEY is not configured", code: "backup_unconfigured" });
    return;
  }
  const [job] = await db.insert(backupJobsTable).values({
    kind: "manual",
    requestedBy: (res.locals.user as { id: number }).id,
  }).returning();
  res.status(202).json({ ...job, telegramAttempts: [] });
  void executeBackup(job.id);
});

router.post("/admin/backups/:id/verify", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [job] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, id));
  if (!job?.archivePath || !job.checksumSha256 || job.status !== "completed") {
    res.status(409).json({ error: "A completed backup archive is required" }); return;
  }
  await verifyBackupArchive(job.archivePath, job.checksumSha256);
  res.json({ id, verified: true, checksumSha256: job.checksumSha256 });
});

router.post("/admin/backups/:id/restore/prepare", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [source] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, id));
  if (!source?.archivePath || !source.checksumSha256 || source.status !== "completed") {
    res.status(409).json({ error: "A completed source backup is required" }); return;
  }
  const owner = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  try {
    await db.delete(maintenanceLocksTable).where(lte(maintenanceLocksTable.expiresAt, new Date()));
    await db.insert(maintenanceLocksTable).values({
      name: "database_restore", owner, reason: `verify restore source ${id}`, expiresAt,
    });
  } catch {
    res.status(423).json({ error: "A database maintenance operation is already active" }); return;
  }
  try {
    const [safety] = await db.insert(backupJobsTable).values({
      kind: "pre_restore", requestedBy: (res.locals.user as { id: number }).id,
    }).returning();
    await executeBackup(safety.id, false);
    const [completedSafety] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, safety.id));
    if (completedSafety?.status !== "completed") throw new Error("Mandatory pre-restore backup failed");
    await verifyBackupArchive(source.archivePath, source.checksumSha256);
    res.json({
      ready: true,
      restoreExecuted: false,
      sourceBackupId: id,
      preRestoreBackupId: safety.id,
      semantics: "Restore must run in a transaction where supported; on failure rollback, otherwise restore the pre-restore archive.",
    });
  } finally {
    await db.delete(maintenanceLocksTable).where(and(
      eq(maintenanceLocksTable.name, "database_restore"),
      eq(maintenanceLocksTable.owner, owner),
    ));
  }
});

export default router;