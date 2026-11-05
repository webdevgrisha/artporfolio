import type { RequestHandler } from "express";

import { readerOf } from "#modules/auth/middleware";

import type {
  Work,
  WorkBody,
  WorkParams,
  WorksResponse,
  WorkUsage,
} from "#modules/gallery/works/schema";
import {
  createWork,
  deleteWork,
  getWork,
  getWorkUsage,
  listWorks,
  replaceWork,
} from "#modules/gallery/works/service";
import { ifMatchHeader, isCreateOnly } from "#shared/middleware/preconditions";

export const readWorks: RequestHandler<object, WorksResponse> = async (_request, response) => {
  const { data, etag } = await listWorks(readerOf(response.locals));

  response.status(200).set("ETag", etag).json({ works: data });
};

export const readWorkUsage: RequestHandler<object, WorkUsage> = async (_request, response) => {
  const { data, etag } = await getWorkUsage(readerOf(response.locals));

  response.status(200).set("ETag", etag).json(data);
};

export const readWork: RequestHandler<WorkParams, Work> = async (request, response) => {
  const { data, etag } = await getWork(request.params.id, readerOf(response.locals));

  response.status(200).set("ETag", etag).json(data);
};

/** Creates the work with If-None-Match: *, or replaces the version named in If-Match. */
export const putWork: RequestHandler<WorkParams, Work, WorkBody> = async (request, response) => {
  const { id } = request.params;

  if (isCreateOnly(request)) {
    const { data, etag } = await createWork(id, request.body);

    response.status(201).set("ETag", etag).json(data);
    return;
  }

  const { data, etag } = await replaceWork(id, request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};

export const removeWork: RequestHandler<WorkParams> = async (request, response) => {
  await deleteWork(request.params.id, ifMatchHeader(request));

  response.status(204).end();
};
