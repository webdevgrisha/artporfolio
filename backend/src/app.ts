import express from "express";

import { errorHandler } from "#middleware/error.middleware";
import { healthRouter } from "#routes/health.routes";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/api/health", healthRouter);
app.use(errorHandler);
