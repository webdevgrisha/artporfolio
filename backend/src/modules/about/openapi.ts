import type { ZodOpenApiPathsObject } from "zod-openapi";

import { aboutPhotoPaths } from "#modules/about/photo/openapi";
import { processPhotoPaths } from "#modules/about/process-photos/openapi";
import {
  aboutResponseSchema,
  aboutTextBodySchema,
  aboutTextResponseSchema,
} from "#modules/about/schema";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  payloadTooLargeResponse,
  unauthorizedResponse,
  unsupportedMediaTypeResponse,
} from "#shared/openapi/responses";
import { adminSecurity, publicSecurity } from "#shared/openapi/security";

export const aboutPaths = {
  "/api/about": {
    get: {
      operationId: "getAbout",
      tags: ["About"],
      summary: "Get the About page",
      description: "The texts, «My photo» and the process photos in one response.",
      security: publicSecurity,
      responses: {
        200: jsonResponse("The About page.", aboutResponseSchema),
        403: forbiddenResponse,
      },
    },
    put: {
      operationId: "replaceAboutText",
      tags: ["About"],
      summary: "Replace the texts of the About page",
      description: "Every text is required; values are trimmed. The photos are not changed.",
      security: adminSecurity,
      requestBody: { content: { "application/json": { schema: aboutTextBodySchema } } },
      responses: {
        200: jsonResponse("The saved texts.", aboutTextResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
  },
  ...aboutPhotoPaths,
  ...processPhotoPaths,
} satisfies ZodOpenApiPathsObject;
