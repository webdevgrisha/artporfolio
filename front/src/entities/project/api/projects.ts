import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";
import type { ListPhotoItem } from "@/shared/api/photo";

import { type Project, projectSchema, projectsResponseSchema } from "../model/project";

/** A project as the admin saves it: every field, and the whole list of its photos. */
export interface ProjectBody {
  title: string;
  description: string;
  link: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  photos: readonly ListPhotoItem[];
}

interface CreateProjectParams {
  body: ProjectBody;
  /** A new UUID, which the client picks, so that a repeated request names the same project. */
  id: string;
}

interface ReplaceProjectParams {
  body: ProjectBody;
  /** The ETag of the project the new one was made from. */
  etag: string;
  id: string;
}

interface DeleteProjectParams {
  /** The ETag of the project as the admin saw it, or `*` for whatever version is saved. */
  etag: string;
  id: string;
}

/** Every query of the projects starts with this key, so a change can refresh them all. */
export const projectsQueryKey = ["projects"] as const;

/** Every project in the order the site shows them. */
export const projectsQuery = queryOptions({
  queryFn: async ({ signal }): Promise<Project[]> => {
    const { projects } = await http.get({
      path: "/projects",
      schema: projectsResponseSchema,
      signal,
    });

    return projects;
  },
  queryKey: [...projectsQueryKey, "list"],
});

/** One project with its ETag. A save puts the saved project here. */
export function projectQuery(id: string) {
  return queryOptions({
    queryFn: ({ signal }): Promise<Tagged<Project>> =>
      http.getWithETag({
        path: `/projects/${encodeURIComponent(id)}`,
        schema: projectSchema,
        signal,
      }),
    queryKey: [...projectsQueryKey, "item", id],
  });
}

/**
 * Creates the project `id` at the top of the list and returns it as saved with its ETag. Rejected
 * with 412 when the project exists, for example created by an earlier try whose response was lost,
 * and with 422 when an upload has expired.
 */
export function createProject({ body, id }: CreateProjectParams): Promise<Tagged<Project>> {
  return http.putIfNoneMatch({
    path: `/projects/${encodeURIComponent(id)}`,
    body,
    schema: projectSchema,
  });
}

/**
 * Replaces the project, all its fields and photos at once, and returns it as saved with its new
 * ETag. Rejected with 412 when the project has changed since `etag` was read, with 404 when it was
 * deleted, and with 422 when it names a photo or an upload that no longer exists.
 */
export function replaceProject({ body, etag, id }: ReplaceProjectParams): Promise<Tagged<Project>> {
  return http.putIfMatch({
    path: `/projects/${encodeURIComponent(id)}`,
    body,
    etag,
    schema: projectSchema,
  });
}

/** Deletes the project with its photos. Rejected with 412 when it has changed since `etag` was read. */
export async function deleteProject({ etag, id }: DeleteProjectParams): Promise<void> {
  await http.deleteResourceIfMatch({ path: `/projects/${encodeURIComponent(id)}`, etag });
}
