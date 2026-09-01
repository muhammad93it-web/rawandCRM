import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { accountsTable } from "./accounts";
import { itemsTable } from "./items";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accountsTable.id),
  date: date("date", { mode: "string" }).notNull(),
  total: numeric("total", { precision: 16, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  currency: text("currency").notNull().default("IQD"),
  paymentType: text("payment_type").notNull().default("cash"),
  status: text("status").notNull().default("completed"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("invoices_type_date_idx").on(table.type, table.date),
  index("invoices_account_idx").on(table.accountId),
]);

export const invoiceLinesTable = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => itemsTable.id),
  quantity: numeric("quantity", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  unitPrice: numeric("unit_price", {
    precision: 16,
    scale: 2,
    mode: "number",
  }).notNull(),
  discount: numeric("discount", {
    precision: 16,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  lineTotal: numeric("line_total", {
    precision: 16,
    scale: 2,
    mode: "number",
  }).notNull(),
}, (table) => [
  index("invoice_lines_invoice_idx").on(table.invoiceId),
  index("invoice_lines_item_idx").on(table.itemId),
]);

export type Invoice = typeof invoicesTable.$inferSelect;
export type InvoiceLine = typeof invoiceLinesTable.$inferSelect;