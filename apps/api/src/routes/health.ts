import { Router, type Request, type Response } from "express";
import { checkDatabaseConnection } from "../db/index.js";

export const healthRouter: Router = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection(undefined, 2000);

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus.ok ? "connected" : "disconnected",
    },
  });
});

healthRouter.get("/ready", async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection(undefined, 2000);

  if (dbStatus.ok) {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } else {
    res.status(503).json({
      status: "unavailable",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
      },
      error: dbStatus.error,
    });
  }
});
