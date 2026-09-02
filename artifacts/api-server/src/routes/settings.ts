import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  currenciesTable,
  db,
  quotaRatiosTable,
  settingsTable,
} from "@workspace/db";
import {
  CreateCurrencyBody,
  CreateCurrencyResponse,
  CreateQuotaRatioBody,
  CreateQuotaRatioResponse,
  CreateSettingBody,
  CreateSettingResponse,
  DeleteCurrencyParams,
  DeleteQuotaRatioParams,
  DeleteSettingParams,
  GetCurrencyParams,
  GetCurrencyResponse,
  GetQuotaRatioParams,
  GetQuotaRatioResponse,
  GetSettingParams,
  GetSettingResponse,
  ListCurrenciesResponse,
  ListQuotaRatiosQueryParams,
  ListQuotaRatiosResponse,
  ListSettingsQueryParams,
  ListSettingsResponse,
  UpdateCurrencyBody,
  UpdateCurrencyParams,
  UpdateCurrencyResponse,
  UpdateQuotaRatioBody,
  UpdateQuotaRatioParams,
  UpdateQuotaRatioResponse,
  UpdateSettingBody,
  UpdateSettingParams,
  UpdateSettingResponse,
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
        : "Could not persist setting",
  });
};

router.get("/currencies", async (_req, res): Promise<void> => {
  const rows = await db.select().from(currenciesTable).orderBy(currenciesTable.code);
  res.json(ListCurrenciesResponse.parse(rows));
});

router.post("/currencies", async (req, res): Promise<void> => {
  const body = CreateCurrencyBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(currenciesTable).values(body.data).returning();
    res.status(201).json(CreateCurrencyResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/currencies/:id", async (req, res): Promise<void> => {
  const params = GetCurrencyParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(currenciesTable).where(eq(currenciesTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Currency not found" }); return; }
  res.json(GetCurrencyResponse.parse(row));
});

router.patch("/currencies/:id", async (req, res): Promise<void> => {
  const params = UpdateCurrencyParams.safeParse(req.params);
  const body = UpdateCurrencyBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(currenciesTable).set(body.data)
      .where(eq(currenciesTable.id, params.data.id)).returning();
    if (!updated) { res.status(404).json({ error: "Currency not found" }); return; }
    res.json(UpdateCurrencyResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/currencies/:id", async (req, res): Promise<void> => {
  const params = DeleteCurrencyParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(currenciesTable).set({ status: "inactive" })
    .where(eq(currenciesTable.id, params.data.id)).returning({ id: currenciesTable.id });
  if (!deleted) { res.status(404).json({ error: "Currency not found" }); return; }
  res.sendStatus(204);
});

router.get("/quota-ratios", async (req, res): Promise<void> => {
  const query = ListQuotaRatiosQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [];
  if (query.data.workplaceId) filters.push(eq(quotaRatiosTable.workplaceId, query.data.workplaceId));
  const rows = await db.select().from(quotaRatiosTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(quotaRatiosTable.name);
  res.json(ListQuotaRatiosResponse.parse(rows));
});

router.post("/quota-ratios", async (req, res): Promise<void> => {
  const body = CreateQuotaRatioBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(quotaRatiosTable).values(body.data).returning();
    res.status(201).json(CreateQuotaRatioResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/quota-ratios/:id", async (req, res): Promise<void> => {
  const params = GetQuotaRatioParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(quotaRatiosTable).where(eq(quotaRatiosTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Quota ratio not found" }); return; }
  res.json(GetQuotaRatioResponse.parse(row));
});

router.patch("/quota-ratios/:id", async (req, res): Promise<void> => {
  const params = UpdateQuotaRatioParams.safeParse(req.params);
  const body = UpdateQuotaRatioBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(quotaRatiosTable).set(body.data)
      .where(eq(quotaRatiosTable.id, params.data.id)).returning();
    if (!updated) { res.status(404).json({ error: "Quota ratio not found" }); return; }
    res.json(UpdateQuotaRatioResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/quota-ratios/:id", async (req, res): Promise<void> => {
  const params = DeleteQuotaRatioParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.delete(quotaRatiosTable)
    .where(eq(quotaRatiosTable.id, params.data.id)).returning({ id: quotaRatiosTable.id });
  if (!deleted) { res.status(404).json({ error: "Quota ratio not found" }); return; }
  res.sendStatus(204);
});

router.get("/settings", async (req, res): Promise<void> => {
  const query = ListSettingsQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [];
  if (query.data.workplaceId) filters.push(eq(settingsTable.workplaceId, query.data.workplaceId));
  if (query.data.module) filters.push(eq(settingsTable.module, query.data.module));
  const rows = await db.select().from(settingsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(settingsTable.module, settingsTable.key);
  res.json(ListSettingsResponse.parse(rows));
});

router.post("/settings", async (req, res): Promise<void> => {
  const body = CreateSettingBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(settingsTable)
      .values({ ...body.data, value: body.data.value ?? null })
      .returning();
    res.status(201).json(CreateSettingResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/settings/:id", async (req, res): Promise<void> => {
  const params = GetSettingParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Setting not found" }); return; }
  res.json(GetSettingResponse.parse(row));
});

router.patch("/settings/:id", async (req, res): Promise<void> => {
  const params = UpdateSettingParams.safeParse(req.params);
  const body = UpdateSettingBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(settingsTable).set(body.data)
      .where(eq(settingsTable.id, params.data.id)).returning();
    if (!updated) { res.status(404).json({ error: "Setting not found" }); return; }
    res.json(UpdateSettingResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/settings/:id", async (req, res): Promise<void> => {
  const params = DeleteSettingParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.delete(settingsTable)
    .where(eq(settingsTable.id, params.data.id)).returning({ id: settingsTable.id });
  if (!deleted) { res.status(404).json({ error: "Setting not found" }); return; }
  res.sendStatus(204);
});

export default router;