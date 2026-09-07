import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import {
  accountsTable,
  db,
  invoiceLinesTable,
  invoicesTable,
  itemsTable,
  paymentsTable,
  warehouseStockTable,
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
    paidAmount: invoice.paidAmount,
    status: invoice.status,
    itemsCount: lineCounts.get(invoice.id) ?? 0,
  }));
};

const createInvoice = async (
  type: "sale" | "purchase",
  createdByUserId: number,
  input: {
    accountId: number;
    date: Date;
    currency: string;
    paymentType: "cash" | "credit";
    workplaceId?: number | null;
    warehouseId?: number | null;
    paidAmount?: number;
    discount?: number;
    tax?: number;
    paymentMethod?: string;
    notes?: string;
    lines: Array<{
      itemId: number;
      warehouseId?: number | null;
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

    const total = Math.max(0, preparedLines.reduce((sum, line) => sum + line.lineTotal, 0) - (input.discount ?? 0) + (input.tax ?? 0));
    const paidAmount = input.paymentType === "cash" ? (input.paidAmount ?? total) : (input.paidAmount ?? 0);
    if (paidAmount > total) throw new Error("PAID_AMOUNT_EXCEEDS_TOTAL");
    const prefix = type === "sale" ? "SAL" : "PUR";
    const number = `${prefix}-${Date.now().toString().slice(-7)}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const [invoice] = await tx
      .insert(invoicesTable)
      .values({
        number,
        type,
        workplaceId: input.workplaceId ?? null,
        warehouseId: input.warehouseId ?? null,
        createdByUserId,
        accountId: input.accountId,
        date: input.date.toISOString().slice(0, 10),
        total,
        currency: input.currency,
        paymentType: input.paymentType,
        discount: input.discount ?? 0,
        tax: input.tax ?? 0,
        paidAmount,
        notes: input.notes ?? "",
        status: "completed",
      })
      .returning();

    await tx.insert(invoiceLinesTable).values(
      preparedLines.map((line) => ({
        invoiceId: invoice.id,
        itemId: line.itemId,
        warehouseId: line.warehouseId ?? input.warehouseId ?? null,
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
      const warehouseId = line.warehouseId ?? input.warehouseId;
      if (warehouseId) {
        const stockDelta = type === "sale" ? -line.quantity : line.quantity;
        await tx.insert(warehouseStockTable).values({
          warehouseId,
          itemId: line.itemId,
          quantity: stockDelta,
        }).onConflictDoUpdate({
          target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
          set: { quantity: sql`${warehouseStockTable.quantity} + ${stockDelta}` },
        });
      }
    }

    if (paidAmount > 0) {
      await tx.insert(paymentsTable).values({
        workplaceId: input.workplaceId ?? null,
        accountId: input.accountId,
        cashBoxId: null,
        direction: type === "sale" ? "received" : "paid",
        paymentDate: input.date.toISOString().slice(0, 10),
        amount: paidAmount,
        currency: input.currency,
        paymentMethod: input.paymentMethod ?? input.paymentType,
        referenceType: `${type}_invoice`,
        referenceId: invoice.id,
        note: input.notes ?? "",
        status: "posted",
      });
    }
    const outstanding = total - paidAmount;
    if (outstanding > 0) {
      await tx.update(accountsTable).set({
        balance: type === "sale"
          ? sql`${accountsTable.balance} + ${outstanding}`
          : sql`${accountsTable.balance} - ${outstanding}`,
      }).where(eq(accountsTable.id, input.accountId));
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
      paidAmount: invoice.paidAmount,
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
    const created = await createInvoice("sale", res.locals.user.id, parsed.data);
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
            : code === "PAID_AMOUNT_EXCEEDS_TOTAL"
              ? "Paid amount cannot exceed invoice total"
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
    const created = await createInvoice("purchase", res.locals.user.id, parsed.data);
    res.status(201).json(CreatePurchaseResponse.parse(created));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message =
      code === "ACCOUNT_NOT_FOUND"
        ? "Account not found"
        : code === "ITEM_NOT_FOUND"
          ? "Item not found"
            : code === "PAID_AMOUNT_EXCEEDS_TOTAL"
              ? "Paid amount cannot exceed invoice total"
          : "Could not create purchase";
    res.status(code ? 400 : 500).json({ error: message });
  }
});

export { listInvoices };
export default router;