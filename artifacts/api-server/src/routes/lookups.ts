/**
 * Shared lookup tables (`/lookups/{kind}`) — see lib/db/src/schema/lookups.ts.
 *
 * One generic CRUD surface for all configuration lists of the reference system so that every
 * area (items, accounts, accounting, ...) can fill its dropdowns while config-org owns the editors.
 */
import { Router, type IRouter, type Response } from "express";
import { and, asc, eq, isNull } from "drizzle-orm";
import { alias, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import {
  accountClass1Table,
  accountClass2Table,
  accountClass3Table,
  accountClass4Table,
  accountClass5Table,
  accountClassesTable,
  accountTypesTable,
  citiesTable,
  colorsTable,
  countriesTable,
  db,
  expenseSubtypesTable,
  expenseTypesTable,
  incomeSubtypesTable,
  incomeTypesTable,
  itemAttributesTable,
  itemModelsTable,
  itemSizesTable,
  itemSubtypes2Table,
  itemSubtypesTable,
  itemTypesTable,
  itemVersionsTable,
  ownershipTypesTable,
  purchaseExpenseTypesTable,
  purchaseIssueTypesTable,
  releaseDatesTable,
} from "@workspace/db";
import {
  CreateLookupBody,
  CreateLookupParams,
  CreateLookupResponse,
  DeleteLookupParams,
  ListLookupsParams,
  ListLookupsResponse,
  UpdateLookupBody,
  UpdateLookupParams,
  UpdateLookupResponse,
} from "@workspace/api-zod";

type LookupKind = (typeof ListLookupsParams)["_output"]["kind"];

type LookupRow = {
  id: number;
  name?: string;
  nameKu?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  color?: string;
  isPrimary?: boolean;
  onAccount?: boolean;
  sortOrder: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

type ParentDef = { column: string; kind: LookupKind };

type LookupTable = PgTable;

/** Column access by name — the lookup tables share a shape but are distinct Drizzle types. */
const col = (table: PgTable, name: string): AnyPgColumn =>
  (table as unknown as Record<string, AnyPgColumn>)[name] as AnyPgColumn;

type KindDef = {
  table: LookupTable;
  trilingual: boolean;
  parent?: ParentDef;
  extras: Array<"code" | "color" | "isPrimary" | "onAccount">;
};

const KINDS: Record<LookupKind, KindDef> = {
  "item-types": { table: itemTypesTable, trilingual: true, extras: ["isPrimary"] },
  "item-subtypes": { table: itemSubtypesTable, trilingual: true, parent: { column: "itemTypeId", kind: "item-types" }, extras: [] },
  "item-subtypes2": { table: itemSubtypes2Table, trilingual: true, parent: { column: "itemSubtypeId", kind: "item-subtypes" }, extras: [] },
  "item-models": { table: itemModelsTable, trilingual: true, extras: [] },
  "item-sizes": { table: itemSizesTable, trilingual: true, extras: [] },
  countries: { table: countriesTable, trilingual: true, extras: [] },
  colors: { table: colorsTable, trilingual: true, extras: [] },
  "release-dates": { table: releaseDatesTable, trilingual: false, extras: [] },
  "item-attributes": { table: itemAttributesTable, trilingual: true, extras: [] },
  "item-versions": { table: itemVersionsTable, trilingual: true, extras: [] },
  cities: { table: citiesTable, trilingual: false, extras: [] },
  "account-types": { table: accountTypesTable, trilingual: true, extras: [] },
  "account-class1": { table: accountClass1Table, trilingual: false, extras: [] },
  "account-class2": { table: accountClass2Table, trilingual: false, parent: { column: "parentId", kind: "account-class1" }, extras: [] },
  "account-class3": { table: accountClass3Table, trilingual: false, parent: { column: "parentId", kind: "account-class2" }, extras: [] },
  "account-class4": { table: accountClass4Table, trilingual: false, parent: { column: "parentId", kind: "account-class3" }, extras: [] },
  "account-class5": { table: accountClass5Table, trilingual: false, parent: { column: "parentId", kind: "account-class4" }, extras: [] },
  "account-classes": { table: accountClassesTable, trilingual: true, extras: ["color"] },
  "ownership-types": { table: ownershipTypesTable, trilingual: true, extras: [] },
  "expense-types": { table: expenseTypesTable, trilingual: false, extras: ["code"] },
  "expense-subtypes": { table: expenseSubtypesTable, trilingual: false, parent: { column: "expenseTypeId", kind: "expense-types" }, extras: [] },
  "purchase-expense-types": { table: purchaseExpenseTypesTable, trilingual: false, extras: ["onAccount"] },
  "income-types": { table: incomeTypesTable, trilingual: false, extras: ["code"] },
  "income-subtypes": { table: incomeSubtypesTable, trilingual: false, parent: { column: "incomeTypeId", kind: "income-types" }, extras: [] },
  "purchase-issue-types": { table: purchaseIssueTypesTable, trilingual: true, extras: [] },
};

const displayName = (def: KindDef, row: LookupRow): string =>
  def.trilingual ? (row.nameKu ?? "") : (row.name ?? "");

const toItem = (kind: LookupKind, row: LookupRow, parentName: string | null) => {
  const def = KINDS[kind];
  return {
    id: row.id,
    kind,
    name: displayName(def, row),
    nameKu: def.trilingual ? (row.nameKu ?? "") : (row.name ?? ""),
    nameAr: row.nameAr ?? "",
    nameEn: row.nameEn ?? "",
    parentId: def.parent ? Number(row[def.parent.column] ?? 0) || null : null,
    parentName,
    code: row.code ?? "",
    color: row.color ?? "",
    isPrimary: row.isPrimary ?? false,
    onAccount: row.onAccount ?? false,
    sortOrder: row.sortOrder,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const parentNameOf = async (def: KindDef, row: LookupRow): Promise<string | null> => {
  if (!def.parent) return null;
  const parentId = Number(row[def.parent.column] ?? 0);
  if (!parentId) return null;
  const parentDef = KINDS[def.parent.kind];
  const [parent] = await db.select().from(parentDef.table).where(eq(col(parentDef.table, "id"), parentId));
  return parent ? displayName(parentDef, parent as LookupRow) : null;
};

const invalid = (res: Response, message: string): void => {
  res.status(400).json({ error: message });
};

const persistenceError = (res: Response, error: unknown): void => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23505" ? 409 : code === "23503" ? 400 : 500).json({
    error: code === "23505"
      ? "A record with the same unique value already exists"
      : code === "23503"
        ? "A referenced record does not exist"
        : "Could not persist lookup row",
  });
};

/** Translate the generic input into the columns that exist for this kind. */
const toValues = (def: KindDef, body: (typeof CreateLookupBody)["_output"], partial: boolean):
  { values: Record<string, unknown> } | { error: string } => {
  const values: Record<string, unknown> = {};
  const name = (body.nameKu ?? body.name ?? "").trim();
  if (def.trilingual) {
    if (name) values.nameKu = name;
    if (body.nameAr !== undefined) values.nameAr = body.nameAr.trim();
    if (body.nameEn !== undefined) values.nameEn = body.nameEn.trim();
  } else if (name) {
    values.name = name;
  }
  if (!partial && !name) return { error: "name is required" };
  if (def.parent) {
    if (body.parentId !== undefined && body.parentId !== null) values[def.parent.column] = body.parentId;
    else if (!partial) return { error: "parentId is required" };
  }
  for (const extra of def.extras) {
    if (body[extra] !== undefined) values[extra] = body[extra];
  }
  if (body.sortOrder !== undefined) values.sortOrder = body.sortOrder;
  return { values };
};

const router: IRouter = Router();

router.get("/lookups/:kind", async (req, res): Promise<void> => {
  const params = ListLookupsParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const def = KINDS[params.data.kind];
  const nameColumn = col(def.table, def.trilingual ? "nameKu" : "name");
  if (def.parent) {
    const parentDef = KINDS[def.parent.kind];
    const parentAlias = alias(parentDef.table, "parent") as unknown as PgTable;
    const parentNameColumn = col(parentAlias, parentDef.trilingual ? "nameKu" : "name");
    const rows = await db
      .select({ row: def.table, parentName: parentNameColumn })
      .from(def.table)
      .leftJoin(parentAlias, eq(col(def.table, def.parent.column), col(parentAlias, "id")))
      .where(isNull(col(def.table, "deletedAt")))
      .orderBy(asc(col(def.table, "sortOrder")), asc(nameColumn));
    res.json(ListLookupsResponse.parse(rows.map((r) => toItem(params.data.kind, r.row as LookupRow, (r.parentName as string | null) ?? null))));
    return;
  }
  const rows = await db.select().from(def.table).where(isNull(col(def.table, "deletedAt"))).orderBy(asc(col(def.table, "sortOrder")), asc(nameColumn));
  res.json(ListLookupsResponse.parse(rows.map((r) => toItem(params.data.kind, r as LookupRow, null))));
});

router.post("/lookups/:kind", async (req, res): Promise<void> => {
  const params = CreateLookupParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const body = CreateLookupBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  const def = KINDS[params.data.kind];
  const converted = toValues(def, body.data, false);
  if ("error" in converted) { invalid(res, converted.error); return; }
  try {
    const [created] = await db.insert(def.table).values(converted.values).returning();
    const row = created as LookupRow;
    res.status(201).json(CreateLookupResponse.parse(toItem(params.data.kind, row, await parentNameOf(def, row))));
  } catch (error) { persistenceError(res, error); }
});

router.patch("/lookups/:kind/:id", async (req, res): Promise<void> => {
  const params = UpdateLookupParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const body = UpdateLookupBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  const def = KINDS[params.data.kind];
  const converted = toValues(def, body.data, true);
  if ("error" in converted) { invalid(res, converted.error); return; }
  if (Object.keys(converted.values).length === 0) { invalid(res, "Nothing to update"); return; }
  try {
    const [updated] = await db.update(def.table).set(converted.values)
      .where(and(eq(col(def.table, "id"), params.data.id), isNull(col(def.table, "deletedAt")))).returning();
    if (!updated) { res.status(404).json({ error: "Lookup row not found" }); return; }
    const row = updated as LookupRow;
    res.json(UpdateLookupResponse.parse(toItem(params.data.kind, row, await parentNameOf(def, row))));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/lookups/:kind/:id", async (req, res): Promise<void> => {
  const params = DeleteLookupParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const def = KINDS[params.data.kind];
  const [deleted] = await db.update(def.table).set({ deletedAt: new Date() })
    .where(and(eq(col(def.table, "id"), params.data.id), isNull(col(def.table, "deletedAt")))).returning();
  if (!deleted) { res.status(404).json({ error: "Lookup row not found" }); return; }
  res.status(204).send();
});

export default router;
