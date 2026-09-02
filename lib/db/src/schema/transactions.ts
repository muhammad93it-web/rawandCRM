import {
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  accountName: text("account_name").notNull().default(""),
  amount: numeric("amount", { precision: 16, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  currency: text("currency").notNull().default("IQD"),
  status: text("status").notNull().default("posted"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByUserId: integer("deleted_by_user_id"),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("transactions_type_date_idx").on(table.type, table.date),
  check("transactions_type_check", sql`${table.type} in ('income', 'expense')`),
  check("transactions_amount_check", sql`${table.amount} >= 0`),
]);

export type Transaction = typeof transactionsTable.$inferSelect;