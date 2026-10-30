import type { RequestHandler } from "express";

import type {
  ProcessPhotosBody,
  ProcessPhotosResponse,
} from "#modules/about/process-photos/schema";
import { listProcessPhotos, replaceProcessPhotos } from "#modules/about/process-photos/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const listPhotos: RequestHandler<object, ProcessPhotosResponse> = async (
  _request,
  response,
) => {
  const { etag, processPhotos } = await listProcessPhotos();

  response.status(200).set("ETag", etag).json({ processPhotos });
};

export const replacePhotos: RequestHandler<
  object,
  ProcessPhotosResponse,
  ProcessPhotosBody
> = async (request, response) => {
  const { etag, processPhotos } = await replaceProcessPhotos(
    request.body.processPhotos,
    ifMatchHeader(request),
  );

  response.status(200).set("ETag", etag).json({ processPhotos });
};
