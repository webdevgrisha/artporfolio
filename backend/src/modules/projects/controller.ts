import type { RequestHandler } from "express";
import { getProjectsOrder, replaceProjectsOrder } from "#modules/projects/order";
import type {
  Project,
  ProjectBody,
  ProjectParams,
  ProjectsOrder,
  ProjectsResponse,
} from "#modules/projects/schema";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  replaceProject,
} from "#modules/projects/service";
import { ifMatchHeader, isCreateOnly } from "#shared/middleware/preconditions";

export const readProjects: RequestHandler<object, ProjectsResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await listProjects();

  response.status(200).set("ETag", etag).json({ projects: data });
};

export const readProject: RequestHandler<ProjectParams, Project> = async (request, response) => {
  const { data, etag } = await getProject(request.params.id);

  response.status(200).set("ETag", etag).json(data);
};

/** Creates the project with If-None-Match: *, or replaces the version named in If-Match. */
export const putProject: RequestHandler<ProjectParams, Project, ProjectBody> = async (
  request,
  response,
) => {
  const { id } = request.params;

  if (isCreateOnly(request)) {
    const { data, etag } = await createProject(id, request.body);

    response.status(201).set("ETag", etag).json(data);
    return;
  }

  const { data, etag } = await replaceProject(id, request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
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
