import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  db,
  driversTable,
  employeesTable,
  groupsTable,
  usersTable,
  workplacesTable,
} from "@workspace/db";
import {
  CreateDriverBody,
  CreateDriverResponse,
  CreateEmployeeBody,
  CreateEmployeeResponse,
  CreateGroupBody,
  CreateGroupResponse,
  CreateUserBody,
  CreateUserResponse,
  CreateWorkplaceBody,
  CreateWorkplaceResponse,
  ListDriversQueryParams,
  ListDriversResponse,
  ListEmployeesQueryParams,
  ListEmployeesResponse,
  ListGroupsQueryParams,
  ListGroupsResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  ListWorkplacesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const scrypt = promisify(scryptCallback);

const invalid = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], message: string) => {
  res.status(400).json({ error: message });
};

const persistenceError = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23505" ? 409 : code === "23503" ? 400 : 500).json({
    error:
      code === "23505"
        ? "A record with the same unique value already exists"
        : code === "23503"
          ? "A referenced record does not exist"
          : "Could not persist record",
  });
};

const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
};

router.get("/workplaces", async (_req, res): Promise<void> => {
  const rows = await db.select().from(workplacesTable)
    .where(isNull(workplacesTable.deletedAt)).orderBy(workplacesTable.name);
  res.json(ListWorkplacesResponse.parse(rows));
});

router.post("/workplaces", async (req, res): Promise<void> => {
  const parsed = CreateWorkplaceBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.message);
  try {
    const [created] = await db.insert(workplacesTable)
      .values({ ...parsed.data, status: "active" }).returning();
    res.status(201).json(CreateWorkplaceResponse.parse(created));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.get("/groups", async (req, res): Promise<void> => {
  const parsed = ListGroupsQueryParams.safeParse(req.query);
  if (!parsed.success) return invalid(res, parsed.error.message);
  const filters = [isNull(groupsTable.deletedAt)];
  if (parsed.data.workplaceId) filters.push(eq(groupsTable.workplaceId, parsed.data.workplaceId));
  const rows = await db.select().from(groupsTable).where(and(...filters)).orderBy(groupsTable.name);
  res.json(ListGroupsResponse.parse(rows));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.message);
  try {
    const [created] = await db.insert(groupsTable)
      .values({ ...parsed.data, status: "active" }).returning();
    res.status(201).json(CreateGroupResponse.parse(created));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) return invalid(res, parsed.error.message);
  const filters = [isNull(usersTable.deletedAt)];
  if (parsed.data.workplaceId) filters.push(eq(usersTable.workplaceId, parsed.data.workplaceId));
  const rows = await db.select().from(usersTable).where(and(...filters)).orderBy(usersTable.displayName);
  res.json(ListUsersResponse.parse(rows));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.message);
  try {
    const { password, ...record } = parsed.data;
    const [created] = await db.insert(usersTable).values({
      ...record,
      passwordHash: await hashPassword(password),
      status: "active",
    }).returning();
    res.status(201).json(CreateUserResponse.parse(created));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.get("/employees", async (req, res): Promise<void> => {
  const parsed = ListEmployeesQueryParams.safeParse(req.query);
  if (!parsed.success) return invalid(res, parsed.error.message);
  const filters = [isNull(employeesTable.deletedAt)];
  if (parsed.data.workplaceId) filters.push(eq(employeesTable.workplaceId, parsed.data.workplaceId));
  const rows = await db.select().from(employeesTable).where(and(...filters)).orderBy(employeesTable.name);
  res.json(ListEmployeesResponse.parse(rows));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.message);
  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return invalid(res, "endDate must not be before startDate");
  }
  try {
    const [created] = await db.insert(employeesTable).values({
      ...parsed.data,
      startDate: parsed.data.startDate?.toISOString().slice(0, 10),
      endDate: parsed.data.endDate?.toISOString().slice(0, 10),
      status: "active",
    }).returning();
    res.status(201).json(CreateEmployeeResponse.parse(created));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.get("/drivers", async (req, res): Promise<void> => {
  const parsed = ListDriversQueryParams.safeParse(req.query);
  if (!parsed.success) return invalid(res, parsed.error.message);
  const filters = [isNull(driversTable.deletedAt)];
  if (parsed.data.workplaceId) filters.push(eq(driversTable.workplaceId, parsed.data.workplaceId));
  const rows = await db.select().from(driversTable).where(and(...filters)).orderBy(driversTable.name);
  res.json(ListDriversResponse.parse(rows));
});

router.post("/drivers", async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.message);
  try {
    const [created] = await db.insert(driversTable)
      .values({ ...parsed.data, status: "active" }).returning();
    res.status(201).json(CreateDriverResponse.parse(created));
  } catch (error) {
    persistenceError(res, error);
  }
});

export default router;