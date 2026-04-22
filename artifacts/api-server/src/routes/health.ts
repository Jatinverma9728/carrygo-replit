import { Router, type IRouter } from "express";
import { zodSchemas } from "@workspace/api-zod";
const { HealthCheckResponse } = zodSchemas;

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
