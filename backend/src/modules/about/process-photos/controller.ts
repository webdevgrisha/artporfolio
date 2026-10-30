import type { RequestHandler } from "express";

import type {
  ProcessPhotoOrder,
  ProcessPhotoParams,
  ProcessPhotoResponse,
  ProcessPhotosBody,
  ProcessPhotosResponse,
} from "#modules/about/process-photos/schema";
import {
  addProcessPhoto,
  deleteProcessPhoto,
  getProcessPhoto,
  getProcessPhotoOrder,
  listProcessPhotos,
  reorderProcessPhotos,
  replaceProcessPhoto,
  replaceProcessPhotos,
  updateProcessPhotoAlt,
} from "#modules/about/process-photos/service";
import type { PhotoAltBody } from "#shared/images/photo";
import { ifMatchHeader } from "#shared/middleware/preconditions";
import { uploadedFile } from "#shared/middleware/upload";

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

export const uploadPhoto: RequestHandler<object, ProcessPhotoResponse, PhotoAltBody> = async (
  request,
  response,
) => {
  const processPhoto = await addProcessPhoto(uploadedFile(request), request.body.alt);

  // baseUrl is where the router is mounted: /api/about/process-photos.
  response.status(201).location(`${request.baseUrl}/${processPhoto.id}`).json({ processPhoto });
};

export const readPhoto: RequestHandler<ProcessPhotoParams, ProcessPhotoResponse> = async (
  request,
  response,
) => {
  response.status(200).json({ processPhoto: await getProcessPhoto(request.params.id) });
};

export const replacePhoto: RequestHandler<
  ProcessPhotoParams,
  ProcessPhotoResponse,
  PhotoAltBody
> = async (request, response) => {
  const processPhoto = await replaceProcessPhoto(
    request.params.id,
    uploadedFile(request),
    request.body.alt,
  );

  response.status(200).json({ processPhoto });
};

export const updatePhotoAlt: RequestHandler<
  ProcessPhotoParams,
  ProcessPhotoResponse,
  PhotoAltBody
> = async (request, response) => {
  const processPhoto = await updateProcessPhotoAlt(request.params.id, request.body.alt);

  response.status(200).json({ processPhoto });
};

export const deletePhoto: RequestHandler<ProcessPhotoParams> = async (request, response) => {
  await deleteProcessPhoto(request.params.id);

  response.status(204).end();
};

export const readOrder: RequestHandler<object, ProcessPhotoOrder> = async (_request, response) => {
  response.status(200).json({ ids: await getProcessPhotoOrder() });
};

export const replaceOrder: RequestHandler<object, ProcessPhotoOrder, ProcessPhotoOrder> = async (
  request,
  response,
) => {
  response.status(200).json({ ids: await reorderProcessPhotos(request.body.ids) });
};
