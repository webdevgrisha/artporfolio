import type { ZodOpenApiPathsObject } from "zod-openapi";

import { contactPhotoPaths } from "#modules/contacts/photo/openapi";
import {
  contactsBodySchema,
  contactsResponseSchema,
  savedContactsResponseSchema,
} from "#modules/contacts/schema";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  payloadTooLargeResponse,
  unauthorizedResponse,
  unsupportedMediaTypeResponse,
} from "#shared/openapi/responses";
import { adminSecurity } from "#shared/openapi/security";

export const contactsPaths = {
  "/api/contacts": {
    get: {
      operationId: "getContacts",
      tags: ["Contacts"],
      summary: "Get the contact links and the contact photo",
      description: "Public. Returns empty strings until the links are first saved.",
      responses: {
        200: jsonResponse("The contacts.", contactsResponseSchema),
      },
    },
    put: {
      operationId: "replaceContacts",
      tags: ["Contacts"],
      summary: "Replace the contact links",
      description: "Every field is required; values are trimmed.",
      security: adminSecurity,
      requestBody: { content: { "application/json": { schema: contactsBodySchema } } },
      responses: {
        200: jsonResponse("The saved links.", savedContactsResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
  },
  ...contactPhotoPaths,
} satisfies ZodOpenApiPathsObject;
