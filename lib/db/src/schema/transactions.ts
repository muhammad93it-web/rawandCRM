import {
  date,
  index,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("transactions_type_date_idx").on(table.type, table.date),
]);

export type Transaction = typeof transactionsTable.$inferSelect;