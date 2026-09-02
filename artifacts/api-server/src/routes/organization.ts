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
  DeleteDriverParams,
  DeleteEmployeeParams,
  DeleteGroupParams,
  DeleteUserParams,
  DeleteWorkplaceParams,
  GetDriverParams,
  GetDriverResponse,
  GetEmployeeParams,
  GetEmployeeResponse,
  GetGroupParams,
  GetGroupResponse,
  GetUserParams,
  GetUserResponse,
  GetWorkplaceParams,
  GetWorkplaceResponse,
  ListDriversQueryParams,
  ListDriversResponse,
  ListEmployeesQueryParams,
  ListEmployeesResponse,
  ListGroupsQueryParams,
  ListGroupsResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  ListWorkplacesResponse,
  UpdateDriverBody,
  UpdateDriverParams,
  UpdateDriverResponse,
  UpdateEmployeeBody,
  UpdateEmployeeParams,
  UpdateEmployeeResponse,
  UpdateGroupBody,
  UpdateGroupParams,
  UpdateGroupResponse,
  UpdateUserBody,
  UpdateUserParams,
  UpdateUserResponse,
  UpdateWorkplaceBody,
  UpdateWorkplaceParams,
  UpdateWorkplaceResponse,
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

router.get("/workplaces/:id", async (req, res): Promise<void> => {
  const params = GetWorkplaceParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(workplacesTable).where(and(
    eq(workplacesTable.id, params.data.id),
    isNull(workplacesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Workplace not found" }); return; }
  res.json(GetWorkplaceResponse.parse(row));
});

router.patch("/workplaces/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkplaceParams.safeParse(req.params);
  const body = UpdateWorkplaceBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(workplacesTable)
      .set(body.data)
      .where(and(eq(workplacesTable.id, params.data.id), isNull(workplacesTable.deletedAt)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Workplace not found" }); return; }
    res.json(UpdateWorkplaceResponse.parse(updated));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.delete("/workplaces/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkplaceParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(workplacesTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(workplacesTable.id, params.data.id), isNull(workplacesTable.deletedAt)))
    .returning({ id: workplacesTable.id });
  if (!deleted) { res.status(404).json({ error: "Workplace not found" }); return; }
  res.sendStatus(204);
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

router.get("/groups/:id", async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(groupsTable).where(and(
    eq(groupsTable.id, params.data.id),
    isNull(groupsTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Group not found" }); return; }
  res.json(GetGroupResponse.parse(row));
});

router.patch("/groups/:id", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  const body = UpdateGroupBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(groupsTable)
      .set(body.data)
      .where(and(eq(groupsTable.id, params.data.id), isNull(groupsTable.deletedAt)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Group not found" }); return; }
    res.json(UpdateGroupResponse.parse(updated));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.delete("/groups/:id", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(groupsTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(groupsTable.id, params.data.id), isNull(groupsTable.deletedAt)))
    .returning({ id: groupsTable.id });
  if (!deleted) { res.status(404).json({ error: "Group not found" }); return; }
  res.sendStatus(204);
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

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(usersTable).where(and(
    eq(usersTable.id, params.data.id),
    isNull(usersTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "User not found" }); return; }
  res.json(GetUserResponse.parse(row));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  const body = UpdateUserBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const { password, ...record } = body.data;
    const [updated] = await db.update(usersTable)
      .set({
        ...record,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      })
      .where(and(eq(usersTable.id, params.data.id), isNull(usersTable.deletedAt)))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json(UpdateUserResponse.parse(updated));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(usersTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(usersTable.id, params.data.id), isNull(usersTable.deletedAt)))
    .returning({ id: usersTable.id });
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
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

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(employeesTable).where(and(
    eq(employeesTable.id, params.data.id),
    isNull(employeesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(GetEmployeeResponse.parse(row));
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  const body = UpdateEmployeeBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  if (body.data.startDate && body.data.endDate && body.data.endDate < body.data.startDate) {
    invalid(res, "endDate must not be before startDate");
    return;
  }
  try {
    const [updated] = await db.update(employeesTable)
      .set({
        ...body.data,
        startDate: body.data.startDate === undefined ? undefined : body.data.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: body.data.endDate === undefined ? undefined : body.data.endDate?.toISOString().slice(0, 10) ?? null,
      })
      .where(and(eq(employeesTable.id, params.data.id), isNull(employeesTable.deletedAt)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Employee not found" }); return; }
    res.json(UpdateEmployeeResponse.parse(updated));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(employeesTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(employeesTable.id, params.data.id), isNull(employeesTable.deletedAt)))
    .returning({ id: employeesTable.id });
  if (!deleted) { res.status(404).json({ error: "Employee not found" }); return; }
  res.sendStatus(204);
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

router.get("/drivers/:id", async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(driversTable).where(and(
    eq(driversTable.id, params.data.id),
    isNull(driversTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json(GetDriverResponse.parse(row));
});

router.patch("/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  const body = UpdateDriverBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(driversTable)
      .set(body.data)
      .where(and(eq(driversTable.id, params.data.id), isNull(driversTable.deletedAt)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Driver not found" }); return; }
    res.json(UpdateDriverResponse.parse(updated));
  } catch (error) {
    persistenceError(res, error);
  }
});

router.delete("/drivers/:id", async (req, res): Promise<void> => {
  const params = DeleteDriverParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(driversTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(driversTable.id, params.data.id), isNull(driversTable.deletedAt)))
    .returning({ id: driversTable.id });
  if (!deleted) { res.status(404).json({ error: "Driver not found" }); return; }
  res.sendStatus(204);
});

export default router;