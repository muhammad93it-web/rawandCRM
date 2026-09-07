import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, mkdir, open, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, createGunzip } from "node:zlib";
import { and, desc, eq } from "drizzle-orm";
import {
  backupJobsTable,
  backupSettingsTable,
  db,
  telegramDeliveryAttemptsTable,
} from "@workspace/db";
import { logger } from "./logger";

const MAGIC = Buffer.from("RAWANDBK1");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MAX_TELEGRAM_ATTEMPTS = 4;

function encryptionKey(): Buffer {
  const configured = process.env.BACKUP_ENCRYPTION_KEY?.trim();
  if (!configured) throw new Error("BACKUP_ENCRYPTION_KEY is not configured");
  const key = /^[a-f0-9]{64}$/i.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");
  if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY must decode to exactly 32 bytes");
  return key;
}

function safeError(error: unknown): string {
  let message = (error instanceof Error ? error.message : String(error))
    .replace(/(?:postgres(?:ql)?:\/\/)[^\s]+/gi, "[database connection redacted]")
    .replace(/api\.telegram\.org\/bot[^/\s]+/gi, "api.telegram.org/bot[redacted]");
  for (const secret of [process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID]) {
    if (secret) message = message.replaceAll(secret, "[redacted]");
  }
  return message.slice(0, 1000);
}

function databaseProcess(): { args: string[]; env: NodeJS.ProcessEnv } {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const url = new URL(process.env.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_URL does not contain a database name");
  const sslMode = url.searchParams.get("sslmode");
  return {
    args: ["--format=p", "--no-owner", "--no-privileges"],
    env: {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port || "5432",
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: database,
      ...(sslMode ? { PGSSLMODE: sslMode } : {}),
    },
  };
}

export async function verifyBackupArchive(filePath: string, expectedChecksum: string): Promise<void> {
  const file = await stat(filePath);
  if (file.size <= MAGIC.length + IV_BYTES + TAG_BYTES) throw new Error("Backup archive is truncated");
  const handle = await open(filePath, "r");
  const prefix = Buffer.alloc(MAGIC.length + IV_BYTES);
  const tag = Buffer.alloc(TAG_BYTES);
  await handle.read(prefix, 0, prefix.length, 0);
  await handle.read(tag, 0, tag.length, file.size - TAG_BYTES);
  await handle.close();
  if (!prefix.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Backup archive header is invalid");
  const digest = createHash("sha256");
  await pipeline(createReadStream(filePath), new Writable({
    write(chunk, _encoding, callback) {
      digest.update(chunk);
      callback();
    },
  }));
  if (digest.digest("hex") !== expectedChecksum) throw new Error("Backup SHA-256 checksum does not match");
  const iv = prefix.subarray(MAGIC.length);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  await pipeline(
    createReadStream(filePath, { start: MAGIC.length + IV_BYTES, end: file.size - TAG_BYTES - 1 }),
    decipher,
    createGunzip(),
    new Writable({ write(_chunk, _encoding, callback) { callback(); } }),
  );
}

async function deliverTelegram(jobId: number, filePath: string, checksum: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    await db.insert(telegramDeliveryAttemptsTable).values({ backupJobId: jobId, attempt: 1, status: "unconfigured" });
    return;
  }
  for (let attempt = 1; attempt <= MAX_TELEGRAM_ATTEMPTS; attempt += 1) {
    await db.insert(telegramDeliveryAttemptsTable).values({ backupJobId: jobId, attempt, status: "sending" });
    try {
      const form = new FormData();
      form.set("chat_id", chatId);
      form.set("caption", `Rawand CRM backup #${jobId}\nSHA-256: ${checksum}`);
      form.set("document", new Blob([await readFile(filePath)]), path.basename(filePath));
      const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(120_000),
      });
      const payload = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.description || `Telegram returned HTTP ${response.status}`);
      await db.update(telegramDeliveryAttemptsTable).set({
        status: "sent",
        telegramMessageId: String(payload.result?.message_id ?? ""),
      }).where(and(
        eq(telegramDeliveryAttemptsTable.backupJobId, jobId),
        eq(telegramDeliveryAttemptsTable.attempt, attempt),
      ));
      return;
    } catch (error) {
      const final = attempt === MAX_TELEGRAM_ATTEMPTS;
      const delayMs = Math.min(30_000, 1000 * (2 ** (attempt - 1)));
      await db.update(telegramDeliveryAttemptsTable).set({
        status: final ? "failed" : "retrying",
        error: safeError(error),
        nextRetryAt: final ? null : new Date(Date.now() + delayMs),
      }).where(and(
        eq(telegramDeliveryAttemptsTable.backupJobId, jobId),
        eq(telegramDeliveryAttemptsTable.attempt, attempt),
      ));
      if (final) return;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function enforceRetention(): Promise<void> {
  const [setting] = await db.select({ retentionCount: backupSettingsTable.retentionCount })
    .from(backupSettingsTable).where(eq(backupSettingsTable.id, 1));
  const expired = await db.select({ id: backupJobsTable.id, archivePath: backupJobsTable.archivePath })
    .from(backupJobsTable)
    .where(eq(backupJobsTable.status, "completed"))
    .orderBy(desc(backupJobsTable.completedAt))
    .limit(1000)
    .offset(setting?.retentionCount ?? 14);
  for (const job of expired) {
    if (job.archivePath) await unlink(job.archivePath).catch(() => undefined);
    await db.delete(backupJobsTable).where(eq(backupJobsTable.id, job.id));
  }
}

export async function executeBackup(jobId: number, applyRetention = true): Promise<void> {
  const directory = path.resolve(process.env.BACKUP_DIRECTORY || "data/backups");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filePath = path.join(directory, `rawand-${jobId}-${Date.now()}.sql.gz.aes`);
  await db.update(backupJobsTable).set({ status: "running", startedAt: new Date() }).where(eq(backupJobsTable.id, jobId));
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const hash = createHash("sha256");
  const database = databaseProcess();
  const dump = spawn("pg_dump", database.args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: database.env,
  });
  const dumpFinished = new Promise<number | null>((resolve, reject) => {
    dump.once("error", reject);
    dump.once("close", resolve);
  });
  let stderr = "";
  dump.stderr.on("data", (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-2000); });
  try {
    const output = createWriteStream(filePath, { flags: "wx", mode: 0o600 });
    const prefix = Buffer.concat([MAGIC, iv]);
    output.write(prefix);
    hash.update(prefix);
    const hashing = new Transform({
      transform(chunk, _encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    await pipeline(dump.stdout, createGzip({ level: 9 }), cipher, hashing, output);
    const exitCode = await dumpFinished;
    if (exitCode !== 0) throw new Error(`pg_dump failed with exit code ${exitCode}: ${stderr}`);
    const tag = cipher.getAuthTag();
    await appendFile(filePath, tag);
    hash.update(tag);
    const checksum = hash.digest("hex");
    await verifyBackupArchive(filePath, checksum);
    const archive = await stat(filePath);
    await db.update(backupJobsTable).set({
      status: "completed",
      archivePath: filePath,
      checksumSha256: checksum,
      archiveBytes: archive.size,
      encryption: { algorithm: "AES-256-GCM", format: "RAWANDBK1", compression: "gzip" },
      completedAt: new Date(),
    }).where(eq(backupJobsTable.id, jobId));
    await deliverTelegram(jobId, filePath, checksum);
    if (applyRetention) await enforceRetention();
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    await db.update(backupJobsTable).set({
      status: "failed", error: safeError(error), completedAt: new Date(),
    }).where(eq(backupJobsTable.id, jobId));
    logger.error({ jobId, err: safeError(error) }, "Backup job failed");
  }
}