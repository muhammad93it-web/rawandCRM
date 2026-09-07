import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./organization";

export const backupSettingsTable = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  frequency: text("frequency").notNull().default("daily"),
  localTime: text("local_time").notNull().default("02:00"),
  dayOfWeek: integer("day_of_week"),
  dayOfMonth: integer("day_of_month"),
  customCron: text("custom_cron"),
  timezone: text("timezone").notNull().default("Asia/Baghdad"),
  retentionCount: integer("retention_count").notNull().default(14),
  telegramBotTokenEncrypted: text("telegram_bot_token_encrypted"),
  telegramChatId: text("telegram_chat_id"),
  telegramDailyReportEnabled: boolean("telegram_daily_report_enabled").notNull().default(false),
  telegramDailyReportTimes: jsonb("telegram_daily_report_times").notNull().default([]),
  telegramMonthlyReportEnabled: boolean("telegram_monthly_report_enabled").notNull().default(false),
  telegramAttachBackup: boolean("telegram_attach_backup").notNull().default(true),
  telegramBackupSendTimes: jsonb("telegram_backup_send_times").notNull().default([]),
  updatedBy: integer("updated_by").references(() => usersTable.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  check("backup_settings_singleton_check", sql`${table.id} = 1`),
  check("backup_settings_frequency_check", sql`${table.frequency} in ('daily', 'weekly', 'monthly', 'custom')`),
  check("backup_settings_retention_check", sql`${table.retentionCount} between 1 and 365`),
]);

export const backupJobsTable = pgTable("backup_jobs", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("queued"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  requestedBy: integer("requested_by").references(() => usersTable.id),
  archivePath: text("archive_path"),
  checksumSha256: text("checksum_sha256"),
  archiveBytes: bigint("archive_bytes", { mode: "number" }),
  encryption: jsonb("encryption"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("backup_jobs_created_idx").on(table.createdAt),
  uniqueIndex("backup_jobs_scheduled_uidx").on(table.scheduledFor),
  check("backup_jobs_kind_check", sql`${table.kind} in ('manual', 'scheduled', 'pre_restore')`),
  check("backup_jobs_status_check", sql`${table.status} in ('queued', 'running', 'completed', 'failed')`),
]);

export const telegramDeliveryAttemptsTable = pgTable("telegram_delivery_attempts", {
  id: serial("id").primaryKey(),
  backupJobId: integer("backup_job_id").notNull().references(() => backupJobsTable.id, { onDelete: "cascade" }),
  attempt: integer("attempt").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  telegramMessageId: text("telegram_message_id"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("telegram_delivery_job_attempt_uidx").on(table.backupJobId, table.attempt),
  check("telegram_delivery_status_check", sql`${table.status} in ('sending', 'sent', 'retrying', 'failed', 'unconfigured')`),
]);

export const maintenanceLocksTable = pgTable("maintenance_locks", {
  name: text("name").primaryKey(),
  owner: text("owner").notNull(),
  reason: text("reason").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});