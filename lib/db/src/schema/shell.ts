import { date, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { currenciesTable } from "./settings";
import { usersTable } from "./organization";

export const currencyRatesTable = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  currencyId: integer("currency_id").notNull().references(() => currenciesTable.id),
  rate: numeric("rate", { precision: 18, scale: 4, mode: "number" }).notNull(),
  rateDate: date("rate_date", { mode: "string" }).notNull(),
  recordedByUserId: integer("recorded_by_user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("currency_rates_currency_date_idx").on(table.currencyId, table.rateDate),
]);

export const userFavoritesTable = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("user_favorites_user_path_uidx").on(table.userId, table.path),
  index("user_favorites_user_order_idx").on(table.userId, table.sortOrder),
]);