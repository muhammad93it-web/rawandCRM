import { Router, type IRouter } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import {
  accountsTable,
  db,
  invoiceLinesTable,
  invoicesTable,
  itemsTable,
  transactionsTable,
} from "@workspace/db";
import {
  ListDeletedRecordsQueryParams,
  ListDeletedRecordsResponse,
  RestoreDeletedRecordParams,
  RestoreDeletedRecordResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/deleted-records", async (req, res): Promise<void> => {
  const parsed = ListDeletedRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const resource = parsed.data.resource;
  let records: Array<{
    id: number;
    resource: string;
    summary: string;
    reference: string | null;
    recordDate: string | null;
    deletedAt: Date;
    deletedByUserId: number | null;
    deletionReason: string | null;
  }> = [];

  if (resource === "accounts") {
    const rows = await db.select().from(accountsTable).where(isNotNull(accountsTable.deletedAt));
    records = rows.map((row) => ({
      id: row.id, resource, summary: row.name, reference: null, recordDate: null,
      deletedAt: row.deletedAt!, deletedByUserId: null, deletionReason: null,
    }));
  } else if (resource === "items") {
    const rows = await db.select().from(itemsTable).where(isNotNull(itemsTable.deletedAt));
    records = rows.map((row) => ({
      id: row.id, resource, summary: row.name, reference: row.barcode, recordDate: null,
      deletedAt: row.deletedAt!, deletedByUserId: null, deletionReason: null,
    }));
  } else if (resource === "incomes" || resource === "expenses") {
    const type = resource === "incomes" ? "income" : "expense";
    const rows = await db.select().from(transactionsTable).where(and(
      eq(transactionsTable.type, type),
      isNotNull(transactionsTable.deletedAt),
    ));
    records = rows.map((row) => ({
      id: row.id, resource, summary: row.description, reference: row.category, recordDate: row.date,
      deletedAt: row.deletedAt!, deletedByUserId: row.deletedByUserId, deletionReason: row.deletionReason,
    }));
  } else if (resource === "purchase-invoices" || resource === "sale-invoices") {
    const type = resource === "purchase-invoices" ? "purchase" : "sale";
    const rows = await db.select().from(invoicesTable).where(and(
      eq(invoicesTable.type, type),
      isNotNull(invoicesTable.deletedAt),
    ));
    records = rows.map((row) => ({
      id: row.id, resource, summary: row.number, reference: row.number, recordDate: row.date,
      deletedAt: row.deletedAt!, deletedByUserId: row.deletedByUserId, deletionReason: row.deletionReason,
    }));
  } else {
    const type = resource === "purchase-items" ? "purchase" : "sale";
    const rows = await db.select({
      id: invoiceLinesTable.id,
      itemName: itemsTable.name,
      invoiceNumber: invoicesTable.number,
      invoiceDate: invoicesTable.date,
      deletedAt: invoiceLinesTable.deletedAt,
    }).from(invoiceLinesTable)
      .innerJoin(invoicesTable, eq(invoicesTable.id, invoiceLinesTable.invoiceId))
      .innerJoin(itemsTable, eq(itemsTable.id, invoiceLinesTable.itemId))
      .where(and(eq(invoicesTable.type, type), isNotNull(invoiceLinesTable.deletedAt)));
    records = rows.map((row) => ({
      id: row.id, resource, summary: row.itemName, reference: row.invoiceNumber,
      recordDate: row.invoiceDate, deletedAt: row.deletedAt!,
      deletedByUserId: null, deletionReason: null,
    }));
  }

  records.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  res.json(ListDeletedRecordsResponse.parse(records));
});

router.post("/deleted-records/:resource/:id/restore", async (req, res): Promise<void> => {
  const parsed = RestoreDeletedRecordParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.resource === "accounts" || parsed.data.resource === "items") {
    const table = parsed.data.resource === "accounts" ? accountsTable : itemsTable;
    const [record] = await db.select({
      id: table.id,
      deletedAt: table.deletedAt,
      deletedByApp: table.deletedByApp,
    }).from(table).where(eq(table.id, parsed.data.id));
    if (!record?.deletedAt) {
      res.status(404).json({ error: "Deleted record not found" });
      return;
    }
    if (!record.deletedByApp) {
      res.status(409).json({ error: "Record was not deleted by this application" });
      return;
    }
    await db.update(table).set({
      deletedAt: null,
      deletedByApp: false,
      status: "active",
    }).where(eq(table.id, parsed.data.id));
    res.sendStatus(204);
    return;
  }
  res.status(501).json(RestoreDeletedRecordResponse.parse({
    error: `Restore semantics are not configured for ${parsed.data.resource}`,
    code: "UNSUPPORTED_LEGACY_BEHAVIOR",
  }));
});

export default router;