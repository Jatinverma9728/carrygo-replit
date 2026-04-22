import { Router, type IRouter, type ErrorRequestHandler } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tripsRouter from "./trips";
import parcelsRouter from "./parcels";
import requestsRouter from "./requests";
import deliveriesRouter from "./deliveries";
import chatsRouter from "./chats";
import notificationsRouter from "./notifications";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tripsRouter);
router.use(parcelsRouter);
router.use(requestsRouter);
router.use(deliveriesRouter);
router.use(chatsRouter);
router.use(notificationsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid input", details: err.issues });
    return;
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err?.message ?? "Internal error" });
};
router.use(errorHandler);

export default router;
