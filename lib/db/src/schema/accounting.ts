import { sql } from "drizzle-orm";
import { check, date, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { accountsTable } from "./accounts";
import { workplacesTable } from "./organization";

export const accountCategoriesTable = pgTable("account_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  accountType: text("account_type").notNull(),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("account_categories_name_type_uidx").on(table.name, table.accountType),
  check("account_categories_type_check", sql`${table.accountType} in ('customer', 'supplier', 'other')`),
]);

export const accountCategoryAssignmentsTable = pgTable("account_category_assignments", {
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => accountCategoriesTable.id),
}, (table) => [
  uniqueIndex("account_category_assignments_account_uidx").on(table.accountId),
  index("account_category_assignments_category_idx").on(table.categoryId),
]);

export const openingDebtsTable = pgTable("opening_debts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  side: text("side").notNull(),
  debtDate: date("debt_date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 16, scale: 2, mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("opening_debts_account_date_idx").on(table.accountId, table.debtDate),
  check("opening_debts_side_check", sql`${table.side} in ('purchase', 'sale')`),
  check("opening_debts_amount_check", sql`${table.amount} >= 0`),
]);

export const cashBoxesTable = pgTable("cash_boxes", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").notNull().references(() => workplacesTable.id),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("cash_boxes_workplace_name_currency_uidx").on(table.workplaceId, table.name, table.currency),
  index("cash_boxes_workplace_idx").on(table.workplaceId),
]);

export const financialEntriesTable = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  accountId: integer("account_id").references(() => accountsTable.id),
  cashBoxId: integer("cash_box_id").references(() => cashBoxesTable.id),
  type: text("type").notNull(),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  category: text("category").notNull().default(""),
  description: text("description").notNull().default(""),
  amount: numeric("amount", { precision: 16, scale: 2, mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  paymentMethod: text("payment_method").notNull().default(""),
  dueDate: date("due_date", { mode: "string" }),
  status: text("status").notNull().default("posted"),
  attachmentUrl: text("attachment_url"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByUserId: integer("deleted_by_user_id"),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("financial_entries_type_date_idx").on(table.type, table.entryDate),
  index("financial_entries_account_date_idx").on(table.accountId, table.entryDate),
  index("financial_entries_cash_box_date_idx").on(table.cashBoxId, table.entryDate),
  check("financial_entries_type_check", sql`${table.type} in ('income', 'expense', 'debt', 'capital', 'profit_loss')`),
  check("financial_entries_amount_check", sql`${table.amount} >= 0`),
  check("financial_entries_status_check", sql`${table.status} in ('draft', 'posted', 'settled', 'cancelled')`),
]);

export const accountLedgerEntriesTable = pgTable("account_ledger_entries", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  referenceType: text("reference_type").notNull(),
  referenceId: integer("reference_id").notNull(),
  debit: numeric("debit", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  credit: numeric("credit", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  currency: text("currency").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("account_ledger_reference_uidx").on(table.referenceType, table.referenceId, table.accountId),
  index("account_ledger_account_date_idx").on(table.accountId, table.entryDate),
  check("account_ledger_amounts_check", sql`${table.debit} >= 0 and ${table.credit} >= 0 and (${table.debit} > 0 or ${table.credit} > 0)`),
]);

export const insertAccountCategorySchema = createInsertSchema(accountCategoriesTable).omit({ id: true, deletedAt: true, createdAt: true });
export const insertOpeningDebtSchema = createInsertSchema(openingDebtsTable).omit({ id: true, createdAt: true });
export const insertCashBoxSchema = createInsertSchema(cashBoxesTable).omit({ id: true, deletedAt: true, createdAt: true });
export const insertFinancialEntrySchema = createInsertSchema(financialEntriesTable).omit({ id: true, deletedAt: true, deletedByUserId: true, deletionReason: true, createdAt: true, updatedAt: true });