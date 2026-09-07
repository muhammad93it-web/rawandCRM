import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import dashboardRouter from "./dashboard";
import invoicesRouter from "./invoices";
import itemsRouter from "./items";
import transactionsRouter from "./transactions";
import organizationRouter from "./organization";
import deletedRecordsRouter from "./deleted-records";
import authRouter from "./auth";
import inventoryCatalogRouter from "./inventory-catalog";
import financialEntriesRouter from "./financial-entries";
import settingsRouter from "./settings";
import stockRouter from "./stock";
import reportsRouter from "./reports";
import accountingDomainRouter from "./accounting-domain";
import businessDocumentsRouter from "./business-documents";
import { requireAuth } from "./auth";
import { db, maintenanceLocksTable } from "@workspace/db";
import { gt } from "drizzle-orm";
import shellRouter from "./shell";
import backupsRouter from "./backups";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(async (req, res, next): Promise<void> => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)
    || req.path.startsWith("/admin/backups")
    || req.path.startsWith("/session/")) {
    next();
    return;
  }
  const [lock] = await db.select({ name: maintenanceLocksTable.name })
    .from(maintenanceLocksTable)
    .where(gt(maintenanceLocksTable.expiresAt, new Date()))
    .limit(1);
  if (lock) {
    res.status(423).json({ error: "Database maintenance is active", code: "maintenance_lock" });
    return;
  }
  next();
});
router.use(dashboardRouter);
router.use(accountsRouter);
router.use(itemsRouter);
router.use(invoicesRouter);
router.use(transactionsRouter);
router.use(organizationRouter);
router.use(deletedRecordsRouter);
router.use(inventoryCatalogRouter);
router.use(financialEntriesRouter);
router.use(settingsRouter);
router.use(stockRouter);
router.use(reportsRouter);
router.use(accountingDomainRouter);
router.use(businessDocumentsRouter);
router.use(backupsRouter);

// ==== AREA ROUTERS (one import + one router.use per area; keep alphabetical) ====
import lookupsRouter from "./lookups";
router.use(lookupsRouter);
router.use(shellRouter);
// ==== END AREA ROUTERS ====

export default router;
