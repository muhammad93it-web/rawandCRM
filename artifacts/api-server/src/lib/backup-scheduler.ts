import { eq } from "drizzle-orm";
import { backupJobsTable, backupSettingsTable, db } from "@workspace/db";
import { executeBackup } from "./backups";
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

async function tick(): Promise<void> {
  const [setting] = await db.select().from(backupSettingsTable).where(eq(backupSettingsTable.id, 1));
  const now = new Date();
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