import {
  boolean,
  index,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode").notNull().unique(),
  category: text("category").notNull().default("گشتی"),
  brand: text("brand").notNull().default(""),
  quantity: numeric("quantity", { precision: 14, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  reorderLevel: numeric("reorder_level", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  purchasePrice: numeric("purchase_price", {
    precision: 16,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  salePrice: numeric("sale_price", {
    precision: 16,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  unit: text("unit").notNull().default("دانە"),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByApp: boolean("deleted_by_app").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("items_name_idx").on(table.name),
  index("items_category_idx").on(table.category),
  index("items_status_idx").on(table.status),
]);

export const insertItemSchema = createInsertSchema(itemsTable).omit({
  id: true,
  deletedAt: true,
  deletedByApp: true,
  createdAt: true,
  updatedAt: true,
});

export type Item = typeof itemsTable.$inferSelect;
export type InsertItem = typeof itemsTable.$inferInsert;