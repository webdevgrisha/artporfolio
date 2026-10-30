import type { RequestHandler } from "express";

import type {
  ProjectBody,
  ProjectParams,
  ProjectResponse,
  ProjectsOrder,
  ProjectsResponse,
} from "#modules/projects/schema";
import {
  createProject,
  deleteProject,
  getProject,
  getProjectsOrder,
  listProjects,
  replaceProject,
  replaceProjectsOrder,
} from "#modules/projects/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readProjects: RequestHandler<object, ProjectsResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await listProjects();

  response.status(200).set("ETag", etag).json({ projects: data });
};

export const readProject: RequestHandler<ProjectParams, ProjectResponse> = async (
  request,
  response,
) => {
  const { data, etag } = await getProject(request.params.id);

  response.status(200).set("ETag", etag).json({ project: data });
};

export const postProject: RequestHandler<object, ProjectResponse, ProjectBody> = async (
  request,
  response,
) => {
  const { data, etag, id } = await createProject(request.body);

  response
    .status(201)
    .location(`${request.baseUrl}/${id}`)
    .set("ETag", etag)
    .json({ project: data });
};

export const putProject: RequestHandler<ProjectParams, ProjectResponse, ProjectBody> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceProject(
    request.params.id,
    request.body,
    ifMatchHeader(request),
  );

  response.status(200).set("ETag", etag).json({ project: data });
};

export const removeProject: RequestHandler<ProjectParams> = async (request, response) => {
  await deleteProject(request.params.id, ifMatchHeader(request));

  response.status(204).end();
};

export const readOrder: RequestHandler<object, ProjectsOrder> = async (_request, response) => {
  const { data, etag } = await getProjectsOrder();

  response.status(200).set("ETag", etag).json({ ids: data });
};

export const putOrder: RequestHandler<object, ProjectsOrder, ProjectsOrder> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceProjectsOrder(request.body.ids, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ ids: data });
};
