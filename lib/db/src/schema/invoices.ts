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
import { accountsTable } from "./accounts";
import { itemsTable } from "./items";
import { warehousesTable } from "./inventory";
import { usersTable, workplacesTable } from "./organization";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  warehouseId: integer("warehouse_id").references(() => warehousesTable.id),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
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
  discount: numeric("discount", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  tax: numeric("tax", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  paidAmount: numeric("paid_amount", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByUserId: integer("deleted_by_user_id"),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("invoices_type_date_idx").on(table.type, table.date),
  index("invoices_account_idx").on(table.accountId),
  index("invoices_workplace_idx").on(table.workplaceId),
  index("invoices_warehouse_idx").on(table.warehouseId),
  index("invoices_created_by_user_idx").on(table.createdByUserId),
  check("invoices_type_check", sql`${table.type} in ('sale', 'purchase')`),
  check("invoices_amounts_check", sql`${table.total} >= 0 and ${table.discount} >= 0 and ${table.tax} >= 0 and ${table.paidAmount} >= 0`),
]);

export const invoiceLinesTable = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => itemsTable.id),
  warehouseId: integer("warehouse_id").references(() => warehousesTable.id),
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
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("invoice_lines_invoice_idx").on(table.invoiceId),
  index("invoice_lines_item_idx").on(table.itemId),
  check("invoice_lines_quantity_check", sql`${table.quantity} > 0`),
  check("invoice_lines_amounts_check", sql`${table.unitPrice} >= 0 and ${table.discount} >= 0 and ${table.lineTotal} >= 0`),
]);

export type Invoice = typeof invoicesTable.$inferSelect;
export type InvoiceLine = typeof invoiceLinesTable.$inferSelect;