import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";

import {
  maxProcessPhotos,
  processPhotoOrderBodySchema,
  processPhotoOrderSchema,
  processPhotoParamsSchema,
  processPhotoResponseSchema,
  processPhotosResponseSchema,
} from "#modules/about/process-photos/schema";
import { photoAltBodySchema } from "#shared/images/photo";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  noContentResponse,
  notFoundResponse,
  payloadTooLargeResponse,
  problemResponse,
  unauthorizedResponse,
  unsupportedMediaTypeResponse,
} from "#shared/openapi/responses";
import { adminSecurity, publicSecurity } from "#shared/openapi/security";
import { photoUploadContent } from "#shared/openapi/uploads";

export const processPhotoPaths = {
  "/api/about/process-photos": {
    get: {
      operationId: "listProcessPhotos",
      tags: ["About"],
      summary: "List the process photos",
      security: publicSecurity,
      responses: {
        200: jsonResponse(
          "The photos in the order the site shows them.",
          processPhotosResponseSchema,
        ),
        403: forbiddenResponse,
      },
    },
    post: {
      operationId: "addProcessPhoto",
      tags: ["About"],
      summary: "Add a process photo",
      description: `Adds the photo after the others. The page holds up to ${String(maxProcessPhotos)} process photos.`,
      security: adminSecurity,
      requestBody: { content: photoUploadContent },
      responses: {
        201: {
          ...jsonResponse("The photo was added.", processPhotoResponseSchema),
          headers: z.object({
            Location: z.string().meta({ description: "The URL of the new photo." }),
          }),
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        409: problemResponse(`The page already has ${String(maxProcessPhotos)} process photos.`),
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
  },
  "/api/about/process-photos/order": {
    get: {
      operationId: "getProcessPhotoOrder",
      tags: ["About"],
      summary: "Get the order of the process photos",
      security: publicSecurity,
      responses: {
        200: jsonResponse(
          "The ids in the order the site shows the photos.",
          processPhotoOrderSchema,
        ),
        403: forbiddenResponse,
      },
    },
    put: {
      operationId: "replaceProcessPhotoOrder",
      tags: ["About"],
      summary: "Reorder the process photos",
      security: adminSecurity,
      requestBody: { content: { "application/json": { schema: processPhotoOrderBodySchema } } },
      responses: {
        200: jsonResponse("The saved order.", processPhotoOrderSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        409: problemResponse(
          "The ids do not name every process photo: one was added or deleted since the order was read.",
        ),
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
  },
  "/api/about/process-photos/{id}": {
    get: {
      operationId: "getProcessPhoto",
      tags: ["About"],
      summary: "Get a process photo",
      security: publicSecurity,
      requestParams: { path: processPhotoParamsSchema },
      responses: {
        200: jsonResponse("The photo.", processPhotoResponseSchema),
        403: forbiddenResponse,
        404: notFoundResponse,
      },
    },
    put: {
      operationId: "replaceProcessPhoto",
      tags: ["About"],
      summary: "Replace the file of a process photo",
      description:
        "Replaces the file and the alt text; the id and the position stay. The previous file is deleted after the new one is saved.",
      security: adminSecurity,
      requestParams: { path: processPhotoParamsSchema },
      requestBody: { content: photoUploadContent },
      responses: {
        200: jsonResponse("The photo with the new file.", processPhotoResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
    patch: {
      operationId: "updateProcessPhotoAlt",
      tags: ["About"],
      summary: "Change the alt text of a process photo",
      security: adminSecurity,
      requestParams: { path: processPhotoParamsSchema },
      requestBody: { content: { "application/json": { schema: photoAltBodySchema } } },
      responses: {
        200: jsonResponse("The photo with the new alt text.", processPhotoResponseSchema),
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
    delete: {
      operationId: "deleteProcessPhoto",
      tags: ["About"],
      summary: "Delete a process photo",
      description: "Deletes the photo and every version of its files.",
      security: adminSecurity,
      requestParams: { path: processPhotoParamsSchema },
      responses: {
        204: noContentResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: notFoundResponse,
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
