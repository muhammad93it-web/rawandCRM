import { sql } from "drizzle-orm";
import { check, date, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { accountsTable } from "./accounts";
import { itemsTable } from "./items";
import { cashBoxesTable } from "./accounting";
import { warehousesTable } from "./inventory";
import { workplacesTable } from "./organization";

export const documentsTable = pgTable("business_documents", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  warehouseId: integer("warehouse_id").references(() => warehousesTable.id),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  kind: text("kind").notNull(),
  number: text("number").notNull(),
  documentDate: date("document_date", { mode: "string" }).notNull(),
  validUntil: date("valid_until", { mode: "string" }),
  currency: text("currency").notNull(),
  paymentType: text("payment_type"),
  status: text("status").notNull().default("draft"),
  discount: numeric("discount", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  tax: numeric("tax", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  total: numeric("total", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  paidAmount: numeric("paid_amount", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  notes: text("notes").notNull().default(""),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByUserId: integer("deleted_by_user_id"),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("business_documents_kind_number_uidx").on(table.kind, table.number),
  index("business_documents_kind_date_idx").on(table.kind, table.documentDate),
  index("business_documents_account_idx").on(table.accountId),
  check("business_documents_kind_check", sql`${table.kind} in ('purchase_order', 'purchase_payment', 'sale_offer', 'sale_return', 'sale_talaf', 'sale_collection')`),
  check("business_documents_amounts_check", sql`${table.discount} >= 0 and ${table.tax} >= 0 and ${table.total} >= 0 and ${table.paidAmount} >= 0`),
  check("business_documents_validity_check", sql`${table.validUntil} is null or ${table.validUntil} >= ${table.documentDate}`),
]);

export const documentLinesTable = pgTable("business_document_lines", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => itemsTable.id),
  warehouseId: integer("warehouse_id").references(() => warehousesTable.id),
  description: text("description").notNull().default(""),
  quantity: numeric("quantity", { precision: 14, scale: 2, mode: "number" }).notNull(),
  unitPrice: numeric("unit_price", { precision: 16, scale: 2, mode: "number" }).notNull(),
  discount: numeric("discount", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  tax: numeric("tax", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  lineTotal: numeric("line_total", { precision: 16, scale: 2, mode: "number" }).notNull(),
}, (table) => [
  index("business_document_lines_document_idx").on(table.documentId),
  index("business_document_lines_item_idx").on(table.itemId),
  check("business_document_lines_quantity_check", sql`${table.quantity} > 0`),
  check("business_document_lines_amounts_check", sql`${table.unitPrice} >= 0 and ${table.discount} >= 0 and ${table.tax} >= 0 and ${table.lineTotal} >= 0`),
]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  cashBoxId: integer("cash_box_id").references(() => cashBoxesTable.id),
  direction: text("direction").notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 16, scale: 2, mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  paymentMethod: text("payment_method").notNull().default(""),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("posted"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("payments_account_date_idx").on(table.accountId, table.paymentDate),
  index("payments_cash_box_date_idx").on(table.cashBoxId, table.paymentDate),
  check("payments_direction_check", sql`${table.direction} in ('received', 'paid')`),
  check("payments_amount_check", sql`${table.amount} > 0`),
]);

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, deletedAt: true, deletedByUserId: true, deletionReason: true, createdAt: true, updatedAt: true });
export const insertDocumentLineSchema = createInsertSchema(documentLinesTable).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, deletedAt: true, createdAt: true });