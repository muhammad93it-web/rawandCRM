import { desc, eq } from "drizzle-orm";
import { backupJobsTable, backupSettingsTable, db } from "@workspace/db";
import { deliverTelegram, executeBackup, sendTelegramReport, telegramCrmReport, verifyBackupArchive } from "./backups";
import { logger } from "./logger";

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad", year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function cronFieldMatches(field: string, value: number): boolean {
  return field === "*" || field.split(",").some((entry) => Number(entry) === value);
}

function isDue(setting: typeof backupSettingsTable.$inferSelect, now: Date): boolean {
  const part = localParts(now);
  const [hour, minute] = setting.localTime.split(":").map(Number);
  if (setting.frequency === "custom") {
    const fields = setting.customCron?.trim().split(/\s+/);
    if (fields?.length !== 5) return false;
    const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return cronFieldMatches(fields[0], Number(part.minute))
      && cronFieldMatches(fields[1], Number(part.hour))
      && cronFieldMatches(fields[2], Number(part.day))
      && cronFieldMatches(fields[3], Number(part.month))
      && cronFieldMatches(fields[4], weekdays[part.weekday]);
  }
  if (Number(part.hour) !== hour || Number(part.minute) !== minute) return false;
  if (setting.frequency === "weekly") {
    const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return weekdays[part.weekday] === setting.dayOfWeek;
  }
  return setting.frequency !== "monthly" || Number(part.day) === setting.dayOfMonth;
}

let lastTelegramDispatchMinute = "";

async function verifiedReportAttachment(): Promise<{ path: string; checksum: string } | undefined> {
  let [latest] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.status, "completed"))
    .orderBy(desc(backupJobsTable.completedAt)).limit(1);
  if (!latest?.archivePath || !latest.checksumSha256) {
    const [job] = await db.insert(backupJobsTable).values({ kind: "scheduled" }).returning();
    await executeBackup(job.id);
    [latest] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.id, job.id));
  }
  if (!latest?.archivePath || !latest.checksumSha256 || latest.status !== "completed") throw new Error("Report backup could not be completed");
  await verifyBackupArchive(latest.archivePath, latest.checksumSha256);
  return { path: latest.archivePath, checksum: latest.checksumSha256 };
}

async function tick(): Promise<void> {
  const [setting] = await db.select().from(backupSettingsTable).where(eq(backupSettingsTable.id, 1));
  const now = new Date();
  if (setting) {
    const part = localParts(now);
    const minuteKey = `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}`;
    const dailyTimes = Array.isArray(setting.telegramDailyReportTimes) ? setting.telegramDailyReportTimes : [];
    const sendTimes = Array.isArray(setting.telegramBackupSendTimes) ? setting.telegramBackupSendTimes : [];
    const date = `${part.year}-${part.month}-${part.day}`;
    const dailyReport = setting.telegramDailyReportEnabled && dailyTimes.includes(`${part.hour}:${part.minute}`);
    const lastDay = Number(part.day) === new Date(Number(part.year), Number(part.month), 0).getDate();
    const monthEndReport = setting.telegramMonthlyReportEnabled && lastDay && `${part.hour}:${part.minute}` === "23:30";
    const previousMonthReport = setting.telegramMonthlyReportEnabled && Number(part.day) === 1 && `${part.hour}:${part.minute}` === "09:00";
    const dueSend = sendTimes.includes(`${part.hour}:${part.minute}`);
    if ((dailyReport || monthEndReport || previousMonthReport || dueSend) && lastTelegramDispatchMinute !== minuteKey) {
      lastTelegramDispatchMinute = minuteKey;
      const [latest] = await db.select().from(backupJobsTable).where(eq(backupJobsTable.status, "completed"))
        .orderBy(desc(backupJobsTable.completedAt)).limit(1);
      if (dailyReport || monthEndReport || previousMonthReport) {
        const reportStart = monthEndReport ? `${part.year}-${part.month}-01`
          : previousMonthReport ? new Date(Date.UTC(Number(part.year), Number(part.month) - 2, 1)).toISOString().slice(0, 10)
            : date;
        const reportEnd = previousMonthReport ? new Date(Date.UTC(Number(part.year), Number(part.month) - 1, 0)).toISOString().slice(0, 10) : date;
        const title = monthEndReport ? "مانگی ئێستا" : previousMonthReport ? "مانگی پێشوو" : "ڕۆژانە";
        void (async () => {
          const report = await telegramCrmReport(reportStart, reportEnd, title);
          const attachment = setting.telegramAttachBackup ? await verifiedReportAttachment() : undefined;
          await sendTelegramReport(report, attachment);
        })().catch((error) => logger.warn({ error: String(error).slice(0, 200) }, "Scheduled Telegram report failed"));
      }
      if (dueSend && latest?.archivePath && latest.checksumSha256) {
        void deliverTelegram(latest.id, latest.archivePath, latest.checksumSha256)
          .catch((error) => logger.warn({ error: String(error).slice(0, 200) }, "Scheduled Telegram delivery failed"));
      }
    }
  }
  if (!setting?.enabled || !isDue(setting, now) || !process.env.BACKUP_ENCRYPTION_KEY) return;
  const scheduledFor = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  try {
    const [job] = await db.insert(backupJobsTable).values({ kind: "scheduled", scheduledFor }).returning();
    void executeBackup(job.id);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code !== "23505") logger.error({ errorCode: code || "unknown" }, "Could not schedule backup");
  }
}

export function startBackupScheduler(): void {
  const timer = setInterval(() => void tick(), 30_000);
  timer.unref();
  void tick();
}