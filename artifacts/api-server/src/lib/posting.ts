/**
 * Shared posting helpers — the ONLY code path that may change stock quantities or account balances.
 *
 * Every business document (sale, purchase, return, damage, payment, opening debt, transfer, …) records
 * its effect through these functions inside the same transaction that persists the document, keyed by
 * (referenceType, referenceId) so that the effect can be reversed exactly when the document is deleted
 * or edited (reverse → re-post).
 *
 * Sign conventions
 *  - Stock: `quantity` is always positive; `direction` says whether it enters ('in') or leaves ('out')
 *    the warehouse. `warehouse_stock.quantity` is the running balance and may not go below zero unless
 *    `allowNegative` is set (the reference lets damage/return flows do that; sales do not).
 *  - Ledger: for a customer/supplier account, **debit** increases what the account owes us (credit sale,
 *    payment we made to a supplier), **credit** decreases it (payment received, credit purchase, return).
 *    balance = Σdebit − Σcredit: positive → the account owes us («قەرزی خاوەن حساب»), negative → we owe it.
 *
 * PHP mirror: deploy/cpanel/app/posting.php (keep both in sync).
 */
import { and, eq, sql } from "drizzle-orm";
import {
  accountLedgerEntriesTable,
  db,
  stockMovementsTable,
  warehouseStockTable,
} from "@workspace/db";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = Tx | typeof db;

export type StockDirection = "in" | "out";

export type StockPosting = {
  warehouseId: number;
  itemId: number;
  direction: StockDirection;
  quantity: number;
  date: string; // yyyy-mm-dd
  referenceType: string; // e.g. 'sale_invoice', 'purchase_invoice', 'stock_transfer', 'store_register'
  referenceId: number;
  note?: string;
  /** movement type stored in stock_movements.type; defaults to direction */
  movementType?: "opening" | "in" | "out" | "adjustment" | "transfer_in" | "transfer_out";
  allowNegative?: boolean;
};

export class InsufficientStockError extends Error {
  constructor(public readonly itemId: number, public readonly warehouseId: number, public readonly available: number, public readonly requested: number) {
    super(`Insufficient stock for item ${itemId} in warehouse ${warehouseId}: ${available} available, ${requested} requested`);
    this.name = "InsufficientStockError";
  }
}

/** Post one stock movement and update the warehouse balance. */
export async function postStock(tx: DbOrTx, posting: StockPosting): Promise<void> {
  if (!(posting.quantity > 0)) throw new Error("Stock posting quantity must be positive");
  const signed = posting.direction === "in" ? posting.quantity : -posting.quantity;
  const [current] = await tx
    .select({ quantity: warehouseStockTable.quantity })
    .from(warehouseStockTable)
    .where(and(eq(warehouseStockTable.warehouseId, posting.warehouseId), eq(warehouseStockTable.itemId, posting.itemId)));
  const available = current?.quantity ?? 0;
  if (!posting.allowNegative && available + signed < 0) {
    throw new InsufficientStockError(posting.itemId, posting.warehouseId, available, posting.quantity);
  }
  await tx.insert(stockMovementsTable).values({
    warehouseId: posting.warehouseId,
    itemId: posting.itemId,
    movementDate: posting.date,
    type: posting.movementType ?? posting.direction,
    quantity: signed,
    referenceType: posting.referenceType,
    referenceId: posting.referenceId,
    note: posting.note ?? "",
  });
  await tx
    .insert(warehouseStockTable)
    .values({ warehouseId: posting.warehouseId, itemId: posting.itemId, quantity: signed })
    .onConflictDoUpdate({
      target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
      set: { quantity: sql`${warehouseStockTable.quantity} + ${signed}`, updatedAt: new Date() },
    });
}

/** Reverse every stock movement recorded for a reference (used before delete / re-post on edit). */
export async function reverseStock(tx: DbOrTx, referenceType: string, referenceId: number): Promise<void> {
  const movements = await tx
    .select()
    .from(stockMovementsTable)
    .where(and(eq(stockMovementsTable.referenceType, referenceType), eq(stockMovementsTable.referenceId, referenceId)));
  for (const movement of movements) {
    await tx
      .update(warehouseStockTable)
      .set({ quantity: sql`${warehouseStockTable.quantity} - ${movement.quantity}`, updatedAt: new Date() })
      .where(and(eq(warehouseStockTable.warehouseId, movement.warehouseId), eq(warehouseStockTable.itemId, movement.itemId)));
  }
  await tx
    .delete(stockMovementsTable)
    .where(and(eq(stockMovementsTable.referenceType, referenceType), eq(stockMovementsTable.referenceId, referenceId)));
}

/** Current quantity of an item in a warehouse (0 when unknown). */
export async function itemStock(dbOrTx: DbOrTx, warehouseId: number, itemId: number): Promise<number> {
  const [row] = await dbOrTx
    .select({ quantity: warehouseStockTable.quantity })
    .from(warehouseStockTable)
    .where(and(eq(warehouseStockTable.warehouseId, warehouseId), eq(warehouseStockTable.itemId, itemId)));
  return row?.quantity ?? 0;
}

export type LedgerPosting = {
  accountId: number;
  date: string; // yyyy-mm-dd
  referenceType: string;
  referenceId: number;
  /** amount the account now owes us more (≥ 0) */
  debit?: number;
  /** amount the account now owes us less / we owe it more (≥ 0) */
  credit?: number;
  currency: string; // 'IQD' | 'USD'
  description?: string;
};

/**
 * Post one ledger line for an account. A reference may post at most one line per account
 * (unique index); call `removeLedger` first when re-posting.
 */
export async function postLedger(tx: DbOrTx, posting: LedgerPosting): Promise<void> {
  const debit = posting.debit ?? 0;
  const credit = posting.credit ?? 0;
  if (debit < 0 || credit < 0 || (debit === 0 && credit === 0)) {
    throw new Error("Ledger posting needs a positive debit or credit");
  }
  await tx.insert(accountLedgerEntriesTable).values({
    accountId: posting.accountId,
    entryDate: posting.date,
    referenceType: posting.referenceType,
    referenceId: posting.referenceId,
    debit,
    credit,
    currency: posting.currency,
    description: posting.description ?? "",
  });
}

/** Remove all ledger lines of a reference. */
export async function removeLedger(tx: DbOrTx, referenceType: string, referenceId: number): Promise<void> {
  await tx
    .delete(accountLedgerEntriesTable)
    .where(and(eq(accountLedgerEntriesTable.referenceType, referenceType), eq(accountLedgerEntriesTable.referenceId, referenceId)));
}

export type AccountBalance = { currency: string; debit: number; credit: number; balance: number };

/** Balance per currency for an account (balance = Σdebit − Σcredit). */
export async function accountBalances(dbOrTx: DbOrTx, accountId: number): Promise<AccountBalance[]> {
  const rows = await dbOrTx
    .select({
      currency: accountLedgerEntriesTable.currency,
      debit: sql<number>`coalesce(sum(${accountLedgerEntriesTable.debit}), 0)::float8`,
      credit: sql<number>`coalesce(sum(${accountLedgerEntriesTable.credit}), 0)::float8`,
    })
    .from(accountLedgerEntriesTable)
    .where(eq(accountLedgerEntriesTable.accountId, accountId))
    .groupBy(accountLedgerEntriesTable.currency);
  return rows.map((r) => ({ currency: r.currency, debit: Number(r.debit), credit: Number(r.credit), balance: Number(r.debit) - Number(r.credit) }));
}

/** Balance of an account in one currency. */
export async function accountBalance(dbOrTx: DbOrTx, accountId: number, currency: string): Promise<number> {
  const balances = await accountBalances(dbOrTx, accountId);
  return balances.find((b) => b.currency === currency)?.balance ?? 0;
}
