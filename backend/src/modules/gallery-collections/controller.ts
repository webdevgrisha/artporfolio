import type { RequestHandler } from "express";

import type {
  CollectionBody,
  CollectionParams,
  CollectionResponse,
  CollectionsResponse,
} from "#modules/gallery-collections/schema";
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  replaceCollection,
} from "#modules/gallery-collections/service";
import { ifMatchHeader, isCreateOnly } from "#shared/middleware/preconditions";

export const readCollections: RequestHandler<object, CollectionsResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await listCollections();

  response.status(200).set("ETag", etag).json({ collections: data });
};

export const readCollection: RequestHandler<CollectionParams, CollectionResponse> = async (
  request,
  response,
) => {
  const { data, etag } = await getCollection(request.params.id);

  response.status(200).set("ETag", etag).json({ collection: data });
};

/** Creates the collection with If-None-Match: *, or replaces the version named in If-Match. */
export const putCollection: RequestHandler<
  CollectionParams,
  CollectionResponse,
  CollectionBody
> = async (request, response) => {
  const { id } = request.params;

  if (isCreateOnly(request)) {
    const { data, etag } = await createCollection(id, request.body);

    response.status(201).set("ETag", etag).json({ collection: data });
    return;
  }

  const { data, etag } = await replaceCollection(id, request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ collection: data });
};

export const removeCollection: RequestHandler<CollectionParams> = async (request, response) => {
  await deleteCollection(request.params.id, ifMatchHeader(request));

  response.status(204).end();
};
