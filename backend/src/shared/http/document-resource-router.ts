import { type RequestHandler, Router } from "express";
import type { ZodType } from "zod";

import type { DocumentResource } from "#shared/firebase/document-resource";
import { requireContentType } from "#shared/middleware/content-type";
import { ifMatchHeader, requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

/**
 * The routes of a resource: reading it is public, as the site shows it to every visitor. A change
 * replaces all of it, and only what the client read: it sends the ETag in If-Match.
 */
export function documentResourceRouter<TData extends object>(
  resource: DocumentResource<TData>,
  bodySchema: ZodType,
): Router {
  const read: RequestHandler<object, TData> = async (_request, response) => {
    const { data, etag } = await resource.get();

    response.status(200).set("ETag", etag).json(data);
  };

  const replace: RequestHandler<object, TData, TData> = async (request, response) => {
    const { data, etag } = await resource.replace(request.body, ifMatchHeader(request));

    response.status(200).set("ETag", etag).json(data);
  };

  const router = Router();

  router.get("/", read);
  router.put(
    "/",
    requireContentType("application/json"),
    requireIfMatch,
    validateBody(bodySchema),
    replace,
  );

  return router;
}
