import type { ZodOpenApiPathsObject } from "zod-openapi";

import { healthResponseSchema } from "#modules/health/schema";
import { forbiddenResponse, jsonResponse } from "#shared/openapi/responses";
import { publicSecurity } from "#shared/openapi/security";

export const healthPaths = {
  "/api/health": {
    get: {
      operationId: "getHealth",
      tags: ["Health"],
      summary: "Check that the API is up",
      security: publicSecurity,
      responses: {
        200: jsonResponse("The API is up.", healthResponseSchema),
        403: forbiddenResponse,
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
