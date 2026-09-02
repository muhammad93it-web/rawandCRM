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

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(accountsRouter);
router.use(itemsRouter);
router.use(invoicesRouter);
router.use(transactionsRouter);
router.use(organizationRouter);
router.use(deletedRecordsRouter);
router.use(authRouter);

export default router;
