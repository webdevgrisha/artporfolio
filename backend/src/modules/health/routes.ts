import { Router } from "express";

export const healthRouter = Router();

healthRouter.get<object, { status: "ok" }>("/", (_request, response) => {
  response.json({ status: "ok" });
});
