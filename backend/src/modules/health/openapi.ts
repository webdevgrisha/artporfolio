import type { ZodOpenApiPathsObject } from "zod-openapi";

import { healthResponseSchema } from "#modules/health/schema";
import { jsonResponse } from "#shared/openapi/responses";

export const healthPaths = {
  "/api/health": {
    get: {
      operationId: "getHealth",
      tags: ["Health"],
      summary: "Check that the API is up",
      responses: {
        200: jsonResponse("The API is up.", healthResponseSchema),
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
