import { sql } from "drizzle-orm";
import { check, date, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { itemsTable } from "./items";
import { workplacesTable } from "./organization";

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("brands_name_uidx").on(table.name)]);

export const seriesTable = pgTable("item_series", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => brandsTable.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("item_series_brand_name_uidx").on(table.brandId, table.name),
  index("item_series_brand_idx").on(table.brandId),
]);

export const warehousesTable = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").notNull().references(() => workplacesTable.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  address: text("address").notNull().default(""),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("warehouses_workplace_code_uidx").on(table.workplaceId, table.code),
  index("warehouses_workplace_idx").on(table.workplaceId),
]);

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  details: text("details").notNull().default(""),
  unit: text("unit").notNull().default(""),
  price: numeric("price", { precision: 16, scale: 2, mode: "number" }).notNull().default(0),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("services_workplace_idx").on(table.workplaceId),
  index("services_name_idx").on(table.name),
  check("services_price_check", sql`${table.price} >= 0`),
]);

export const itemCatalogMetadataTable = pgTable("item_catalog_metadata", {
  itemId: integer("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  workplaceId: integer("workplace_id").references(() => workplacesTable.id),
  brandId: integer("brand_id").references(() => brandsTable.id),
  seriesId: integer("series_id").references(() => seriesTable.id),
  code: text("code").notNull().default(""),
  details: text("details").notNull().default(""),
  imageUrl: text("image_url"),
  wholesalePrice: numeric("wholesale_price", { precision: 16, scale: 2, mode: "number" }),
  specialPrice: numeric("special_price", { precision: 16, scale: 2, mode: "number" }),
  extraPrice: numeric("extra_price", { precision: 16, scale: 2, mode: "number" }),
  taxRate: numeric("tax_rate", { precision: 7, scale: 4, mode: "number" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("item_catalog_metadata_item_uidx").on(table.itemId),
  index("item_catalog_metadata_brand_series_idx").on(table.brandId, table.seriesId),
  check("item_catalog_metadata_prices_check", sql`
    (${table.wholesalePrice} is null or ${table.wholesalePrice} >= 0)
    and (${table.specialPrice} is null or ${table.specialPrice} >= 0)
    and (${table.extraPrice} is null or ${table.extraPrice} >= 0)
    and (${table.taxRate} is null or ${table.taxRate} between 0 and 100)
  `),
]);

export const warehouseStockTable = pgTable("warehouse_stock", {
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  quantity: numeric("quantity", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  reorderLevel: numeric("reorder_level", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("warehouse_stock_warehouse_item_uidx").on(table.warehouseId, table.itemId),
  index("warehouse_stock_item_idx").on(table.itemId),
  check("warehouse_stock_reorder_check", sql`${table.reorderLevel} >= 0`),
]);

export const stockTransfersTable = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  fromWarehouseId: integer("from_warehouse_id").notNull().references(() => warehousesTable.id),
  toWarehouseId: integer("to_warehouse_id").notNull().references(() => warehousesTable.id),
  transferDate: date("transfer_date", { mode: "string" }).notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("stock_transfers_date_idx").on(table.transferDate),
  check("stock_transfers_warehouses_check", sql`${table.fromWarehouseId} <> ${table.toWarehouseId}`),
  check("stock_transfers_status_check", sql`${table.status} in ('draft', 'completed', 'cancelled')`),
]);

export const stockTransferLinesTable = pgTable("stock_transfer_lines", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => stockTransfersTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  quantity: numeric("quantity", { precision: 14, scale: 2, mode: "number" }).notNull(),
}, (table) => [
  index("stock_transfer_lines_transfer_idx").on(table.transferId),
  check("stock_transfer_lines_quantity_check", sql`${table.quantity} > 0`),
]);

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  movementDate: date("movement_date", { mode: "string" }).notNull(),
  type: text("type").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 2, mode: "number" }).notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("stock_movements_warehouse_date_idx").on(table.warehouseId, table.movementDate),
  index("stock_movements_item_date_idx").on(table.itemId, table.movementDate),
  check("stock_movements_type_check", sql`${table.type} in ('opening', 'in', 'out', 'adjustment', 'transfer_in', 'transfer_out')`),
  check("stock_movements_quantity_check", sql`${table.quantity} <> 0`),
]);

export const insertBrandSchema = createInsertSchema(brandsTable).omit({ id: true, deletedAt: true, createdAt: true });
export const insertSeriesSchema = createInsertSchema(seriesTable).omit({ id: true, deletedAt: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehousesTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });
export const insertStockTransferSchema = createInsertSchema(stockTransfersTable).omit({ id: true, createdAt: true });
export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, createdAt: true });