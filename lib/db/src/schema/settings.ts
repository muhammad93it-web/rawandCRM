import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { workplacesTable } from "./organization";

export const currenciesTable = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  rate: numeric("rate", { precision: 20, scale: 8, mode: "number" }).notNull(),
  decimals: integer("decimals").notNull().default(2),
  symbol: text("symbol").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("currencies_code_uidx").on(table.code),
  check("currencies_rate_check", sql`${table.rate} > 0`),
  check("currencies_decimals_check", sql`${table.decimals} between 0 and 8`),
]);

export const settingsTable = pgTable("module_settings", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  module: text("module").notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("module_settings_scope_key_uidx").on(table.workplaceId, table.module, table.key),
  index("module_settings_module_idx").on(table.module),
  check("module_settings_module_check", sql`${table.module} in ('general', 'store', 'accounting', 'purchase', 'account')`),
]);

export const quotaRatiosTable = pgTable("quota_ratios", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  name: text("name").notNull(),
  percentage: numeric("percentage", { precision: 7, scale: 4, mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("quota_ratios_workplace_name_uidx").on(table.workplaceId, table.name),
  check("quota_ratios_percentage_check", sql`${table.percentage} between 0 and 100`),
]);

export const insertCurrencySchema = createInsertSchema(currenciesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export const insertQuotaRatioSchema = createInsertSchema(quotaRatiosTable).omit({ id: true, createdAt: true, updatedAt: true });