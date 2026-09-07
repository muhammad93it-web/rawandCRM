import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import {
  db, currenciesTable, currencyRatesTable, userFavoritesTable, usersTable,
  itemsTable, itemCatalogMetadataTable, warehouseStockTable, warehousesTable,
} from "@workspace/db";
import {
  CreateCurrencyRateBody, CreateCurrencyRateResponse, ListCurrencyRatesResponse,
  GetLatestCurrencyRateResponse, CreateFavoriteBody, CreateFavoriteResponse,
  ListFavoritesResponse, GetItemPriceLookupQueryParams, GetItemPriceLookupResponse,
  GetSessionLoginInfoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const rateSelection = {
  id: currencyRatesTable.id, currencyId: currencyRatesTable.currencyId,
  currencyName: currenciesTable.name, currencyCode: currenciesTable.code,
  rate: currencyRatesTable.rate, rateDate: currencyRatesTable.rateDate,
  recordedByUserId: currencyRatesTable.recordedByUserId,
  recordedByName: usersTable.displayName, createdAt: currencyRatesTable.createdAt,
};

router.get("/currency-rates", async (req, res): Promise<void> => {
  const currencyId = req.query.currencyId ? Number(req.query.currencyId) : undefined;
  if (currencyId !== undefined && (!Number.isInteger(currencyId) || currencyId < 1)) {
    res.status(400).json({ error: "Invalid currencyId" }); return;
  }
  const rows = await db.select(rateSelection).from(currencyRatesTable)
    .innerJoin(currenciesTable, eq(currencyRatesTable.currencyId, currenciesTable.id))
    .innerJoin(usersTable, eq(currencyRatesTable.recordedByUserId, usersTable.id))
    .where(currencyId ? eq(currencyRatesTable.currencyId, currencyId) : undefined)
    .orderBy(desc(currencyRatesTable.createdAt), desc(currencyRatesTable.id));
  res.json(ListCurrencyRatesResponse.parse(rows));
});

router.post("/currency-rates", async (req, res): Promise<void> => {
  const parsed = CreateCurrencyRateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid currency rate", details: parsed.error.flatten() }); return; }
  const user = res.locals.user as typeof usersTable.$inferSelect;
  const [currency] = await db.select().from(currenciesTable).where(eq(currenciesTable.id, parsed.data.currencyId));
  if (!currency) { res.status(400).json({ error: "Currency not found" }); return; }
  const [created] = await db.insert(currencyRatesTable).values({
    ...parsed.data,
    rateDate: parsed.data.rateDate.toISOString().slice(0, 10),
    recordedByUserId: user.id,
  }).returning();
  res.status(201).json(CreateCurrencyRateResponse.parse({
    ...created, currencyName: currency.name, currencyCode: currency.code, recordedByName: user.displayName,
  }));
});

router.get("/currency-rates/latest", async (_req, res): Promise<void> => {
  const [row] = await db.select(rateSelection).from(currencyRatesTable)
    .innerJoin(currenciesTable, eq(currencyRatesTable.currencyId, currenciesTable.id))
    .innerJoin(usersTable, eq(currencyRatesTable.recordedByUserId, usersTable.id))
    .where(or(ilike(currenciesTable.code, "USD"), ilike(currenciesTable.name, "dolar")))
    .orderBy(desc(currencyRatesTable.createdAt), desc(currencyRatesTable.id)).limit(1);
  if (!row) { res.json(GetLatestCurrencyRateResponse.parse({ rate: null })); return; }
  res.json(GetLatestCurrencyRateResponse.parse(row));
});

router.delete("/currency-rates/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.delete(currencyRatesTable).where(eq(currencyRatesTable.id, id)).returning({ id: currencyRatesTable.id });
  if (!rows.length) { res.status(404).json({ error: "Currency rate not found" }); return; }
  res.sendStatus(204);
});

router.get("/favorites", async (_req, res): Promise<void> => {
  const user = res.locals.user as typeof usersTable.$inferSelect;
  const rows = await db.select({ id:userFavoritesTable.id,path:userFavoritesTable.path,title:userFavoritesTable.title,sortOrder:userFavoritesTable.sortOrder,createdAt:userFavoritesTable.createdAt })
    .from(userFavoritesTable).where(eq(userFavoritesTable.userId,user.id)).orderBy(asc(userFavoritesTable.sortOrder),asc(userFavoritesTable.id));
  res.json(ListFavoritesResponse.parse(rows));
});

router.post("/favorites", async (req, res): Promise<void> => {
  const parsed=CreateFavoriteBody.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:"Invalid favourite",details:parsed.error.flatten()});return;}
  const user=res.locals.user as typeof usersTable.$inferSelect;
  const [existing]=await db.select({id:userFavoritesTable.id}).from(userFavoritesTable).where(and(eq(userFavoritesTable.userId,user.id),eq(userFavoritesTable.path,parsed.data.path)));
  if(existing){res.status(409).json({error:"Already a favourite"});return;}
  const [created]=await db.insert(userFavoritesTable).values({...parsed.data,userId:user.id}).returning();
  res.status(201).json(CreateFavoriteResponse.parse(created));
});

router.delete("/favorites/:id", async (req,res):Promise<void>=>{
  const id=Number(req.params.id),user=res.locals.user as typeof usersTable.$inferSelect;
  if(!Number.isInteger(id)||id<1){res.status(400).json({error:"Invalid id"});return;}
  const rows=await db.delete(userFavoritesTable).where(and(eq(userFavoritesTable.id,id),eq(userFavoritesTable.userId,user.id))).returning({id:userFavoritesTable.id});
  if(!rows.length){res.status(404).json({error:"Favourite not found"});return;} res.sendStatus(204);
});

router.get("/items/price-lookup",async(req,res):Promise<void>=>{
  const parsed=GetItemPriceLookupQueryParams.safeParse(req.query);
  if(!parsed.success||(!parsed.data.barcode&&!parsed.data.itemId)){res.status(400).json({error:"barcode or itemId is required"});return;}
  const condition=parsed.data.itemId?eq(itemsTable.id,parsed.data.itemId):eq(itemsTable.barcode,parsed.data.barcode!);
  const [found]=await db.select({id:itemsTable.id,name:itemsTable.name,barcode:itemsTable.barcode,unit:itemsTable.unit,retailPrice:itemsTable.salePrice,wholesalePrice:itemCatalogMetadataTable.wholesalePrice,specialPrice:itemCatalogMetadataTable.specialPrice,extraPrice:itemCatalogMetadataTable.extraPrice})
    .from(itemsTable).leftJoin(itemCatalogMetadataTable,eq(itemsTable.id,itemCatalogMetadataTable.itemId)).where(and(condition,isNull(itemsTable.deletedAt))).limit(1);
  if(!found){res.status(404).json({error:"Item not found"});return;}
  const stock=await db.select({warehouseId:warehousesTable.id,warehouseName:warehousesTable.name,quantity:warehouseStockTable.quantity}).from(warehouseStockTable).innerJoin(warehousesTable,eq(warehouseStockTable.warehouseId,warehousesTable.id)).where(and(eq(warehouseStockTable.itemId,found.id),isNull(warehousesTable.deletedAt)));
  res.json(GetItemPriceLookupResponse.parse({...found,wholesalePrice:found.wholesalePrice??0,specialPrice:found.specialPrice??0,extraPrice:found.extraPrice??0,stock}));
});

router.get("/session/login-info",(_req,res):void=>{
  const user=res.locals.user as typeof usersTable.$inferSelect;
  res.json(GetSessionLoginInfoResponse.parse({id:user.id,username:user.username,displayName:user.displayName,lastLoginAt:user.lastLoginAt}));
});
export default router;