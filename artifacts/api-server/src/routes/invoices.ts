import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import {
  accountsTable,
  db,
  invoiceLinesTable,
  invoicesTable,
  itemsTable,
} from "@workspace/db";
import {
  CreatePurchaseBody,
  CreatePurchaseResponse,
  CreateSaleBody,
  CreateSaleResponse,
  ListPurchasesResponse,
  ListSalesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const listInvoices = async (type: "sale" | "purchase") => {
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.type, type))
    .orderBy(sql`${invoicesTable.date} DESC`, sql`${invoicesTable.id} DESC`);

  if (invoices.length === 0) return [];

  const accountIds = [...new Set(invoices.map((invoice) => invoice.accountId))];
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const [accounts, lines] = await Promise.all([
    db.select().from(accountsTable).where(inArray(accountsTable.id, accountIds)),
    db
      .select({ invoiceId: invoiceLinesTable.invoiceId })
      .from(invoiceLinesTable)
      .where(inArray(invoiceLinesTable.invoiceId, invoiceIds)),
  ]);

  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const lineCounts = new Map<number, number>();
  for (const line of lines) {
    lineCounts.set(line.invoiceId, (lineCounts.get(line.invoiceId) ?? 0) + 1);
  }

  return invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    type: invoice.type,
    accountName: accountNames.get(invoice.accountId) ?? "—",
    date: invoice.date,
    total: invoice.total,
    currency: invoice.currency,
    paymentType: invoice.paymentType,
    status: invoice.status,
    itemsCount: lineCounts.get(invoice.id) ?? 0,
  }));
};

const createInvoice = async (
  type: "sale" | "purchase",
  input: {
    accountId: number;
    date: Date;
    currency: string;
    paymentType: "cash" | "credit";
    notes?: string;
    lines: Array<{
      itemId: number;
      quantity: number;
      unitPrice: number;
      discount: number;
    }>;
  },
) =>
  db.transaction(async (tx) => {
    const [account] = await tx
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, input.accountId));
    if (!account) throw new Error("ACCOUNT_NOT_FOUND");

    const itemIds = [...new Set(input.lines.map((line) => line.itemId))];
    const items = await tx
      .select()
      .from(itemsTable)
      .where(inArray(itemsTable.id, itemIds));
    const itemMap = new Map(items.map((item) => [item.id, item]));
    if (items.length !== itemIds.length) throw new Error("ITEM_NOT_FOUND");

    const preparedLines = input.lines.map((line) => {
      const item = itemMap.get(line.itemId)!;
      if (type === "sale" && item.quantity < line.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      return {
        ...line,
        lineTotal: Math.max(0, line.quantity * line.unitPrice - line.discount),
      };
    });

    const total = preparedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const prefix = type === "sale" ? "SAL" : "PUR";
    const number = `${prefix}-${Date.now().toString().slice(-7)}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const [invoice] = await tx
      .insert(invoicesTable)
      .values({
        number,
        type,
        accountId: input.accountId,
        date: input.date.toISOString().slice(0, 10),
        total,
        currency: input.currency,
        paymentType: input.paymentType,
        notes: input.notes ?? "",
        status: "completed",
      })
      .returning();

    await tx.insert(invoiceLinesTable).values(
      preparedLines.map((line) => ({
        invoiceId: invoice.id,
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        lineTotal: line.lineTotal,
      })),
    );

    for (const line of preparedLines) {
      await tx
        .update(itemsTable)
        .set({
          quantity:
            type === "sale"
              ? sql`${itemsTable.quantity} - ${line.quantity}`
              : sql`${itemsTable.quantity} + ${line.quantity}`,
        })
        .where(eq(itemsTable.id, line.itemId));
    }

    return {
      id: invoice.id,
      number: invoice.number,
      type: invoice.type,
      accountName: account.name,
      date: invoice.date,
      total: invoice.total,
      currency: invoice.currency,
      paymentType: invoice.paymentType,
      status: invoice.status,
      itemsCount: preparedLines.length,
    };
  });

router.get("/sales", async (_req, res): Promise<void> => {
  res.json(ListSalesResponse.parse(await listInvoices("sale")));
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const created = await createInvoice("sale", parsed.data);
    res.status(201).json(CreateSaleResponse.parse(created));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message =
      code === "ACCOUNT_NOT_FOUND"
        ? "Account not found"
        : code === "ITEM_NOT_FOUND"
          ? "Item not found"
          : code === "INSUFFICIENT_STOCK"
            ? "Insufficient stock"
            : "Could not create sale";
    res.status(code ? 400 : 500).json({ error: message });
  }
});

router.get("/purchases", async (_req, res): Promise<void> => {
  res.json(ListPurchasesResponse.parse(await listInvoices("purchase")));
});

router.post("/purchases", async (req, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const created = await createInvoice("purchase", parsed.data);
    res.status(201).json(CreatePurchaseResponse.parse(created));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message =
      code === "ACCOUNT_NOT_FOUND"
        ? "Account not found"
        : code === "ITEM_NOT_FOUND"
          ? "Item not found"
          : "Could not create purchase";
    res.status(code ? 400 : 500).json({ error: message });
  }
});

export { listInvoices };
export default router;