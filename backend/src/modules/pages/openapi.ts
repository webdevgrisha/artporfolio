import type { ZodOpenApiPathsObject } from "zod-openapi";

import {
  heroResponseSchema,
  heroUploadBodySchema,
  pageParamsSchema,
  pagesResponseSchema,
} from "#modules/pages/schema";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  noContentResponse,
  notFoundResponse,
  payloadTooLargeResponse,
  unauthorizedResponse,
  unsupportedMediaTypeResponse,
} from "#shared/openapi/responses";
import { adminSecurity } from "#shared/openapi/security";
import { imageFileSchema, imageUploadContent } from "#shared/openapi/uploads";

export const pagesPaths = {
  "/api/pages": {
    get: {
      operationId: "listPages",
      tags: ["Pages"],
      summary: "Get every page of the public site",
      description: "Public.",
      responses: {
        200: jsonResponse("Every page, by id.", pagesResponseSchema),
      },
    },
  },
  "/api/pages/{page}/hero": {
    put: {
      operationId: "uploadPageHero",
      tags: ["Pages"],
      summary: "Upload or replace the hero of a page",
      description: "The previous hero is deleted after the new one is saved.",
      security: adminSecurity,
      requestParams: { path: pageParamsSchema },
      requestBody: {
        content: imageUploadContent(heroUploadBodySchema.extend({ file: imageFileSchema })),
      },
      responses: {
        200: jsonResponse("The hero was replaced.", heroResponseSchema),
        201: jsonResponse("The page had no hero.", heroResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
    delete: {
      operationId: "deletePageHero",
      tags: ["Pages"],
      summary: "Delete the hero of a page",
      description: "Deletes the hero and its files. Succeeds when the page has no hero.",
      security: adminSecurity,
      requestParams: { path: pageParamsSchema },
      responses: {
        204: noContentResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
