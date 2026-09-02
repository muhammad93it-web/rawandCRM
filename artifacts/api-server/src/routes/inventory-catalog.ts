import { Router, type IRouter } from "express";
import { and, eq, ilike, isNull } from "drizzle-orm";
import {
  brandsTable,
  db,
  seriesTable,
  servicesTable,
  warehousesTable,
} from "@workspace/db";
import {
  CreateBrandBody,
  CreateBrandResponse,
  CreateSeriesBody,
  CreateSeriesResponse,
  CreateServiceBody,
  CreateServiceResponse,
  CreateWarehouseBody,
  CreateWarehouseResponse,
  DeleteBrandParams,
  DeleteSeriesParams,
  DeleteServiceParams,
  DeleteWarehouseParams,
  GetBrandParams,
  GetBrandResponse,
  GetSeriesParams,
  GetSeriesResponse,
  GetServiceParams,
  GetServiceResponse,
  GetWarehouseParams,
  GetWarehouseResponse,
  ListSeriesQueryParams,
  ListSeriesResponse,
  ListServicesQueryParams,
  ListServicesResponse,
  ListWarehousesQueryParams,
  ListWarehousesResponse,
  ListBrandsResponse,
  UpdateBrandBody,
  UpdateBrandParams,
  UpdateBrandResponse,
  UpdateSeriesBody,
  UpdateSeriesParams,
  UpdateSeriesResponse,
  UpdateServiceBody,
  UpdateServiceParams,
  UpdateServiceResponse,
  UpdateWarehouseBody,
  UpdateWarehouseParams,
  UpdateWarehouseResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const invalid = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], message: string) => {
  res.status(400).json({ error: message });
};

const persistenceError = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23505" ? 409 : code === "23503" ? 400 : 500).json({
    error: code === "23505"
      ? "A record with the same unique value already exists"
      : code === "23503"
        ? "A referenced record does not exist"
        : "Could not persist record",
  });
};

router.get("/brands", async (_req, res): Promise<void> => {
  const rows = await db.select().from(brandsTable)
    .where(isNull(brandsTable.deletedAt)).orderBy(brandsTable.name);
  res.json(ListBrandsResponse.parse(rows));
});

router.post("/brands", async (req, res): Promise<void> => {
  const body = CreateBrandBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(brandsTable).values({ ...body.data, status: "active" }).returning();
    res.status(201).json(CreateBrandResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const params = GetBrandParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(brandsTable).where(and(
    eq(brandsTable.id, params.data.id), isNull(brandsTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Brand not found" }); return; }
  res.json(GetBrandResponse.parse(row));
});

router.patch("/brands/:id", async (req, res): Promise<void> => {
  const params = UpdateBrandParams.safeParse(req.params);
  const body = UpdateBrandBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(brandsTable).set(body.data).where(and(
      eq(brandsTable.id, params.data.id), isNull(brandsTable.deletedAt),
    )).returning();
    if (!updated) { res.status(404).json({ error: "Brand not found" }); return; }
    res.json(UpdateBrandResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/brands/:id", async (req, res): Promise<void> => {
  const params = DeleteBrandParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(brandsTable).set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(brandsTable.id, params.data.id), isNull(brandsTable.deletedAt)))
    .returning({ id: brandsTable.id });
  if (!deleted) { res.status(404).json({ error: "Brand not found" }); return; }
  res.sendStatus(204);
});

router.get("/series", async (req, res): Promise<void> => {
  const query = ListSeriesQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(seriesTable.deletedAt)];
  if (query.data.brandId) filters.push(eq(seriesTable.brandId, query.data.brandId));
  const rows = await db.select().from(seriesTable).where(and(...filters)).orderBy(seriesTable.name);
  res.json(ListSeriesResponse.parse(rows));
});

router.post("/series", async (req, res): Promise<void> => {
  const body = CreateSeriesBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(seriesTable).values({ ...body.data, status: "active" }).returning();
    res.status(201).json(CreateSeriesResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/series/:id", async (req, res): Promise<void> => {
  const params = GetSeriesParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(seriesTable).where(and(
    eq(seriesTable.id, params.data.id), isNull(seriesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Series not found" }); return; }
  res.json(GetSeriesResponse.parse(row));
});

router.patch("/series/:id", async (req, res): Promise<void> => {
  const params = UpdateSeriesParams.safeParse(req.params);
  const body = UpdateSeriesBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(seriesTable).set(body.data).where(and(
      eq(seriesTable.id, params.data.id), isNull(seriesTable.deletedAt),
    )).returning();
    if (!updated) { res.status(404).json({ error: "Series not found" }); return; }
    res.json(UpdateSeriesResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/series/:id", async (req, res): Promise<void> => {
  const params = DeleteSeriesParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(seriesTable).set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(seriesTable.id, params.data.id), isNull(seriesTable.deletedAt)))
    .returning({ id: seriesTable.id });
  if (!deleted) { res.status(404).json({ error: "Series not found" }); return; }
  res.sendStatus(204);
});

router.get("/warehouses", async (req, res): Promise<void> => {
  const query = ListWarehousesQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(warehousesTable.deletedAt)];
  if (query.data.workplaceId) filters.push(eq(warehousesTable.workplaceId, query.data.workplaceId));
  const rows = await db.select().from(warehousesTable).where(and(...filters)).orderBy(warehousesTable.name);
  res.json(ListWarehousesResponse.parse(rows));
});

router.post("/warehouses", async (req, res): Promise<void> => {
  const body = CreateWarehouseBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(warehousesTable).values({ ...body.data, status: "active" }).returning();
    res.status(201).json(CreateWarehouseResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/warehouses/:id", async (req, res): Promise<void> => {
  const params = GetWarehouseParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(warehousesTable).where(and(
    eq(warehousesTable.id, params.data.id), isNull(warehousesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Warehouse not found" }); return; }
  res.json(GetWarehouseResponse.parse(row));
});

router.patch("/warehouses/:id", async (req, res): Promise<void> => {
  const params = UpdateWarehouseParams.safeParse(req.params);
  const body = UpdateWarehouseBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(warehousesTable).set(body.data).where(and(
      eq(warehousesTable.id, params.data.id), isNull(warehousesTable.deletedAt),
    )).returning();
    if (!updated) { res.status(404).json({ error: "Warehouse not found" }); return; }
    res.json(UpdateWarehouseResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/warehouses/:id", async (req, res): Promise<void> => {
  const params = DeleteWarehouseParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(warehousesTable).set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(warehousesTable.id, params.data.id), isNull(warehousesTable.deletedAt)))
    .returning({ id: warehousesTable.id });
  if (!deleted) { res.status(404).json({ error: "Warehouse not found" }); return; }
  res.sendStatus(204);
});

router.get("/services", async (req, res): Promise<void> => {
  const query = ListServicesQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(servicesTable.deletedAt)];
  if (query.data.workplaceId) filters.push(eq(servicesTable.workplaceId, query.data.workplaceId));
  const rows = await db.select().from(servicesTable).where(and(...filters)).orderBy(servicesTable.name);
  res.json(ListServicesResponse.parse(rows));
});

router.post("/services", async (req, res): Promise<void> => {
  const body = CreateServiceBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(servicesTable).values({ ...body.data, status: "active" }).returning();
    res.status(201).json(CreateServiceResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(servicesTable).where(and(
    eq(servicesTable.id, params.data.id), isNull(servicesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(GetServiceResponse.parse(row));
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  const body = UpdateServiceBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(servicesTable).set(body.data).where(and(
      eq(servicesTable.id, params.data.id), isNull(servicesTable.deletedAt),
    )).returning();
    if (!updated) { res.status(404).json({ error: "Service not found" }); return; }
    res.json(UpdateServiceResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(servicesTable).set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(servicesTable.id, params.data.id), isNull(servicesTable.deletedAt)))
    .returning({ id: servicesTable.id });
  if (!deleted) { res.status(404).json({ error: "Service not found" }); return; }
  res.sendStatus(204);
});

export default router;