import type { RequestHandler } from "express";

import { readerOf } from "#modules/auth/middleware";

import type {
  WorkBody,
  WorkParams,
  WorkResponse,
  WorksResponse,
} from "#modules/gallery-works/schema";
import {
  createWork,
  deleteWork,
  getWork,
  listWorks,
  replaceWork,
} from "#modules/gallery-works/service";
import { ifMatchHeader, isCreateOnly } from "#shared/middleware/preconditions";

export const readWorks: RequestHandler<object, WorksResponse> = async (_request, response) => {
  const { data, etag } = await listWorks(readerOf(response.locals));

  response.status(200).set("ETag", etag).json({ works: data });
};

export const readWork: RequestHandler<WorkParams, WorkResponse> = async (request, response) => {
  const { data, etag } = await getWork(request.params.id, readerOf(response.locals));

  response.status(200).set("ETag", etag).json({ work: data });
};

/** Creates the work with If-None-Match: *, or replaces the version named in If-Match. */
export const putWork: RequestHandler<WorkParams, WorkResponse, WorkBody> = async (
  request,
  response,
) => {
  const { id } = request.params;

  if (isCreateOnly(request)) {
    const { data, etag } = await createWork(id, request.body);

    response.status(201).set("ETag", etag).json({ work: data });
    return;
  }

  const { data, etag } = await replaceWork(id, request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ work: data });
};

export const removeWork: RequestHandler<WorkParams> = async (request, response) => {
  await deleteWork(request.params.id, ifMatchHeader(request));

  response.status(204).end();
};
