import type { ZodOpenApiPathsObject } from "zod-openapi";

import { photoAltBodySchema, photoResponseSchema } from "#shared/images/photo";
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

export const contactPhotoPaths = {
  "/api/contacts/photo": {
    put: {
      operationId: "uploadContactPhoto",
      tags: ["Contacts"],
      summary: "Upload or replace the contact photo",
      description: "The previous photo is deleted after the new one is saved.",
      security: adminSecurity,
      requestBody: {
        content: imageUploadContent(photoAltBodySchema.extend({ file: imageFileSchema })),
      },
      responses: {
        200: jsonResponse("The photo was replaced.", photoResponseSchema),
        201: jsonResponse("The first photo was uploaded.", photoResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
    patch: {
      operationId: "updateContactPhotoAlt",
      tags: ["Contacts"],
      summary: "Change the alt text of the contact photo",
      security: adminSecurity,
      requestBody: { content: { "application/json": { schema: photoAltBodySchema } } },
      responses: {
        200: jsonResponse("The photo with the new alt text.", photoResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
    delete: {
      operationId: "deleteContactPhoto",
      tags: ["Contacts"],
      summary: "Delete the contact photo",
      description: "Deletes the photo and its files. Succeeds when there is no photo.",
      security: adminSecurity,
      responses: {
        204: noContentResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
