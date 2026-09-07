import { randomUUID } from "node:crypto";
import path from "node:path";
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
import { deliverTelegram, encryptTelegramToken, executeBackup, sendTelegramReport, telegramCrmReport, verifyBackupArchive } from "../lib/backups";

const router: IRouter = Router();
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MAX_TIMES = 12;

function times(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((time) => typeof time !== "string" || !TIME.test(time))) return null;
  const unique = [...new Set(value)].sort();
  return unique.length <= MAX_TIMES ? unique : null;
}

function publicSettings(setting: typeof backupSettingsTable.$inferSelect | undefined) {
  const row = setting ?? {
    id: 1, enabled: false, frequency: "daily", localTime: "02:00", dayOfWeek: null, dayOfMonth: null,
    customCron: null, timezone: "Asia/Baghdad", retentionCount: 14, updatedBy: null, updatedAt: null,
    telegramBotTokenEncrypted: null, telegramChatId: null, telegramDailyReportEnabled: false,
    telegramDailyReportTimes: [], telegramMonthlyReportEnabled: false, telegramAttachBackup: true, telegramBackupSendTimes: [],
  };
  const { telegramBotTokenEncrypted: _secret, ...safe } = row;
  return {
    ...safe,
    telegramConfigured: Boolean((row.telegramBotTokenEncrypted || process.env.TELEGRAM_BOT_TOKEN) && (row.telegramChatId || process.env.TELEGRAM_CHAT_ID)),
  };
}

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
     telegramConfigured: Boolean((settings?.telegramBotTokenEncrypted || process.env.TELEGRAM_BOT_TOKEN) && (settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID)),
     schedule: publicSettings(settings),
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
   const dailyTimes = times(body.telegramDailyReportTimes);
   const sendTimes = times(body.telegramBackupSendTimes);
   const botToken = body.telegramBotToken == null ? null : String(body.telegramBotToken).trim();
   const chatId = body.telegramChatId == null ? null : String(body.telegramChatId).trim();
  if (!["daily", "weekly", "monthly", "custom"].includes(frequency)
     || !TIME.test(localTime)
    || !Number.isInteger(retentionCount) || retentionCount < 1 || retentionCount > 365
    || (frequency === "weekly" && (!Number.isInteger(dayOfWeek) || dayOfWeek! < 0 || dayOfWeek! > 6))
    || (frequency === "monthly" && (!Number.isInteger(dayOfMonth) || dayOfMonth! < 1 || dayOfMonth! > 31))
     || (frequency === "custom" && (!customCron || customCron.length > 100 || customCron.trim().split(/\s+/).length !== 5))
     || dailyTimes === null || sendTimes === null || (botToken !== null && (!botToken || botToken.length > 200))
     || (chatId !== null && chatId.length > 100)) {
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
     ...(botToken === null ? {} : { telegramBotTokenEncrypted: encryptTelegramToken(botToken) }),
     telegramChatId: chatId || null,
     telegramDailyReportEnabled: body.telegramDailyReportEnabled === true,
     telegramDailyReportTimes: dailyTimes,
     telegramMonthlyReportEnabled: body.telegramMonthlyReportEnabled === true,
     telegramAttachBackup: body.telegramAttachBackup !== false,
     telegramBackupSendTimes: sendTimes,
    updatedBy: (res.locals.user as { id: number }).id,
    updatedAt: new Date(),
  };
  const [saved] = await db.insert(backupSettingsTable).values(values)
    .onConflictDoUpdate({ target: backupSettingsTable.id, set: values }).returning();
   res.json(publicSettings(saved));
});

router.post("/admin/backups/latest/send", async (_req, res): Promise<void> => {
  const [job] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.status, "completed"))
    .orderBy(desc(backupJobsTable.completedAt)).limit(1);
  if (!job?.archivePath || !job.checksumSha256) {
    res.status(409).json({ error: "No completed backup exists", code: "no_completed_backup" }); return;
  }
  res.status(202).json({ ...job, telegramAttempts: [] });
  void deliverTelegram(job.id, job.archivePath, job.checksumSha256);
});

function calendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

router.post("/admin/backups/telegram/report", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const from = calendarDate(body.from);
  const to = calendarDate(body.to);
  if (!from || !to || from > to || (to.getTime() - from.getTime()) / 86_400_000 > 365
    || (body.attachBackup !== undefined && typeof body.attachBackup !== "boolean")) {
    res.status(400).json({ error: "from and to must be valid calendar dates within an inclusive 366-day range" }); return;
  }
  const fromText = String(body.from);
  const toText = String(body.to);
  const [setting] = await db.select({ attach: backupSettingsTable.telegramAttachBackup })
    .from(backupSettingsTable).where(eq(backupSettingsTable.id, 1));
  const attach = body.attachBackup ?? setting?.attach ?? true;
  try {
    let attachment: { path: string; checksum: string } | undefined;
    if (attach) {
      const [job] = await db.insert(backupJobsTable).values({
        kind: "manual", requestedBy: (res.locals.user as { id: number }).id,
      }).returning();
      await executeBackup(job.id);
      const [completed] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, job.id));
      if (completed?.status !== "completed" || !completed.archivePath || !completed.checksumSha256) {
        throw new Error("Report backup could not be completed");
      }
      await verifyBackupArchive(completed.archivePath, completed.checksumSha256);
      attachment = { path: completed.archivePath, checksum: completed.checksumSha256 };
    }
    await sendTelegramReport(await telegramCrmReport(fromText, toText, "دەستنیشانکراو"), attachment, attach);
    res.json({ delivered: true, from: fromText, to: toText, attached: attach });
  } catch {
    res.status(503).json({ error: "Telegram report delivery failed", code: "telegram_delivery_failed" });
  }
});

router.get("/admin/backups/:id/download", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [job] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, id));
  const directory = path.resolve(process.env.BACKUP_DIRECTORY || "data/backups");
  const archivePath = job?.archivePath ? path.resolve(job.archivePath) : "";
  if (!job || job.status !== "completed" || !job.archivePath || !archivePath.startsWith(`${directory}${path.sep}`)) {
    res.status(409).json({ error: "A completed backup archive is required" }); return;
  }
  res.download(archivePath, `rawand-backup-${job.id}.sql.gz.aes`, (error) => {
    if (error && !res.headersSent) res.status(404).json({ error: "Backup archive is unavailable" });
  });
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