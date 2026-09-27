import type { RequestHandler } from "express";

export const me: RequestHandler = (_request, response) => {
  response.status(200).json({ user: response.locals.auth });
};
