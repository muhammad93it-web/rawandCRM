/**
 * Shared lookup tables ("configuration" entities) of the reference system.
 *
 * Owned by the config-org area (Storeconfig, accountconfiguration, accountingconfigurations,
 * purchaseissueconfig editors). Other areas may reference these tables (FKs / joins) but must
 * not change their columns.
 *
 * Convention: trilingual lookups expose `nameKu` / `nameAr` / `nameEn` (reference columns
 * «وردەکاری (کوردی)» / «(عربی)» / «(ئینگلیزی)» or «ناوی کوردی/عەرەبی/ئینگلیزی»); single-name
 * lookups expose `name`. All are soft-deletable through `deletedAt`.
 */
import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const audit = () => ({
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

const trilingual = () => ({
  nameKu: text("name_ku").notNull(),
  nameAr: text("name_ar").notNull().default(""),
  nameEn: text("name_en").notNull().default(""),
});

// ---------------------------------------------------------------- Storeconfig (کاڵاکان)

/** جۆرەکان — item types; «سەرەکی» marks the primary type. */
export const itemTypesTable = pgTable("item_types", {
  id: serial("id").primaryKey(),
  ...trilingual(),
  isPrimary: boolean("is_primary").notNull().default(false),
  ...audit(),
});

/** جۆری لاوەکی — item sub-type (belongs to an item type). */
export const itemSubtypesTable = pgTable("item_subtypes", {
  id: serial("id").primaryKey(),
  itemTypeId: integer("item_type_id").notNull().references(() => itemTypesTable.id),
  ...trilingual(),
  ...audit(),
}, (t) => [index("item_subtypes_type_idx").on(t.itemTypeId)]);

/** جۆری لاوەکی ٢ — second-level sub-type (belongs to a sub-type). */
export const itemSubtypes2Table = pgTable("item_subtypes2", {
  id: serial("id").primaryKey(),
  itemSubtypeId: integer("item_subtype_id").notNull().references(() => itemSubtypesTable.id),
  ...trilingual(),
  ...audit(),
}, (t) => [index("item_subtypes2_subtype_idx").on(t.itemSubtypeId)]);

/** مۆدێل */
export const itemModelsTable = pgTable("item_models", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** قەبارە */
export const itemSizesTable = pgTable("item_sizes", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** وڵات */
export const countriesTable = pgTable("countries", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** ڕەنگ */
export const colorsTable = pgTable("colors", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** بەرواری دەرچوون — release date / season label. */
export const releaseDatesTable = pgTable("release_dates", { id: serial("id").primaryKey(), name: text("name").notNull(), ...audit() });
/** سیفەت — item attribute / quality. */
export const itemAttributesTable = pgTable("item_attributes", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** وەشان — item version / edition. */
export const itemVersionsTable = pgTable("item_versions", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });

// ---------------------------------------------------------------- accountconfiguration (خاوەن حساب)

/** شار */
export const citiesTable = pgTable("cities", { id: serial("id").primaryKey(), name: text("name").notNull(), ...audit() });
/** جۆر — account type (customer, supplier, …) as configured by the client. */
export const accountTypesTable = pgTable("account_types", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
/** پۆلێنی یەکەم */
export const accountClass1Table = pgTable("account_class1", { id: serial("id").primaryKey(), name: text("name").notNull(), ...audit() });
/** پۆلێنی دووەم (belongs to پۆلێنی یەکەم) */
export const accountClass2Table = pgTable("account_class2", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => accountClass1Table.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("account_class2_parent_idx").on(t.parentId)]);
/** پۆلێنی سێیەم (belongs to پۆلێنی دووەم) */
export const accountClass3Table = pgTable("account_class3", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => accountClass2Table.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("account_class3_parent_idx").on(t.parentId)]);
/** پۆلێنی چوارەم (belongs to پۆلێنی سێیەم) */
export const accountClass4Table = pgTable("account_class4", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => accountClass3Table.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("account_class4_parent_idx").on(t.parentId)]);
/** پۆلێنی پێنجەم (belongs to پۆلێنی چوارەم) */
export const accountClass5Table = pgTable("account_class5", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => accountClass4Table.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("account_class5_parent_idx").on(t.parentId)]);
/** کڵاس — account class with a colour. */
export const accountClassesTable = pgTable("account_classes", {
  id: serial("id").primaryKey(),
  ...trilingual(),
  color: text("color").notNull().default("#000000"),
  ...audit(),
});
/** جۆری خاوەندارێتی — ownership type. */
export const ownershipTypesTable = pgTable("ownership_types", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });

// ---------------------------------------------------------------- accountingconfigurations (خەرجی و داهات)

/** جۆری خەرجی — expense type (name + code). */
export const expenseTypesTable = pgTable("expense_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  ...audit(),
});
/** جۆری خەرجی لاوەکی — expense sub-type. */
export const expenseSubtypesTable = pgTable("expense_subtypes", {
  id: serial("id").primaryKey(),
  expenseTypeId: integer("expense_type_id").notNull().references(() => expenseTypesTable.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("expense_subtypes_type_idx").on(t.expenseTypeId)]);
/** جۆری خەرجی کڕین — purchase expense type; «لەسەر خاوەن حساب» = charged to the supplier account. */
export const purchaseExpenseTypesTable = pgTable("purchase_expense_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  onAccount: boolean("on_account").notNull().default(false),
  ...audit(),
});
/** جۆری داهات — income type (name + code). */
export const incomeTypesTable = pgTable("income_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  ...audit(),
});
/** جۆری لاوەکی داهات — income sub-type. */
export const incomeSubtypesTable = pgTable("income_subtypes", {
  id: serial("id").primaryKey(),
  incomeTypeId: integer("income_type_id").notNull().references(() => incomeTypesTable.id),
  name: text("name").notNull(),
  ...audit(),
}, (t) => [index("income_subtypes_type_idx").on(t.incomeTypeId)]);

// ---------------------------------------------------------------- purchaseissueconfig

/** کێشەکانی کڕین — purchase issue / damage reasons. */
export const purchaseIssueTypesTable = pgTable("purchase_issue_types", { id: serial("id").primaryKey(), ...trilingual(), ...audit() });
