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

export const accountsTable = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    phone: text("phone").notNull().default(""),
    city: text("city").notNull().default(""),
    balance: numeric("balance", { precision: 16, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    currency: text("currency").notNull().default("IQD"),
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
  },
  (table) => [
    index("accounts_name_idx").on(table.name),
    index("accounts_type_idx").on(table.type),
    index("accounts_status_idx").on(table.status),
  ],
);

export const insertAccountSchema = createInsertSchema(accountsTable).omit({
  id: true,
  deletedAt: true,
  deletedByApp: true,
  createdAt: true,
  updatedAt: true,
});

export type Account = typeof accountsTable.$inferSelect;
export type InsertAccount = typeof accountsTable.$inferInsert;