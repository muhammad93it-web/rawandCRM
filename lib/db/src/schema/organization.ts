import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const workplacesTable = pgTable(
  "workplaces",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    address: text("address").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("workplaces_code_uidx").on(table.code),
    index("workplaces_name_idx").on(table.name),
    check("workplaces_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const groupsTable = pgTable(
  "user_groups",
  {
    id: serial("id").primaryKey(),
    workplaceId: integer("workplace_id").references(() => workplacesTable.id),
    name: text("name").notNull(),
    permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("user_groups_workplace_name_uidx").on(table.workplaceId, table.name),
    index("user_groups_workplace_idx").on(table.workplaceId),
    check("user_groups_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    workplaceId: integer("workplace_id").references(() => workplacesTable.id),
    groupId: integer("group_id").references(() => groupsTable.id),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    status: text("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_username_uidx").on(table.username),
    index("users_workplace_idx").on(table.workplaceId),
    index("users_group_idx").on(table.groupId),
    check("users_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const employeesTable = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    workplaceId: integer("workplace_id").notNull().references(() => workplacesTable.id),
    userId: integer("user_id").references(() => usersTable.id),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    jobTitle: text("job_title").notNull().default(""),
    department: text("department").notNull().default(""),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    compensation: numeric("compensation", { precision: 16, scale: 2, mode: "number" }),
    compensationCurrency: text("compensation_currency"),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("employees_workplace_idx").on(table.workplaceId),
    index("employees_name_idx").on(table.name),
    check("employees_status_check", sql`${table.status} in ('active', 'inactive')`),
    check("employees_dates_check", sql`${table.endDate} is null or ${table.startDate} is null or ${table.endDate} >= ${table.startDate}`),
    check("employees_compensation_check", sql`${table.compensation} is null or ${table.compensation} >= 0`),
  ],
);

export const driversTable = pgTable(
  "drivers",
  {
    id: serial("id").primaryKey(),
    workplaceId: integer("workplace_id").notNull().references(() => workplacesTable.id),
    employeeId: integer("employee_id").references(() => employeesTable.id),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    vehicle: text("vehicle").notNull().default(""),
    licenseNumber: text("license_number").notNull().default(""),
    isAssigned: boolean("is_assigned").notNull().default(false),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("drivers_workplace_idx").on(table.workplaceId),
    index("drivers_name_idx").on(table.name),
    check("drivers_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const insertWorkplaceSchema = createInsertSchema(workplacesTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });
export const insertGroupSchema = createInsertSchema(groupsTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });
export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, deletedAt: true, createdAt: true, updatedAt: true });

export type Workplace = typeof workplacesTable.$inferSelect;
export type Group = typeof groupsTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type Employee = typeof employeesTable.$inferSelect;
export type Driver = typeof driversTable.$inferSelect;