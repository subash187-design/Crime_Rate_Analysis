import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import analyticsRouter from "./analytics";
import agentRouter from "./agent";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(incidentsRouter);
router.use(analyticsRouter);
router.use(agentRouter);
router.use(documentsRouter);

export default router;
