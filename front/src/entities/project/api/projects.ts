import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";
import type { ListPhotoItem } from "@/shared/api/photo";

import { type Project, projectResponseSchema, projectsResponseSchema } from "../model/project";

/** A project as the admin saves it: every field, and the whole list of its photos. */
export interface ProjectBody {
  title: string;
  description: string;
  link: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  photos: readonly ListPhotoItem[];
}

interface ReplaceProjectParams {
  body: ProjectBody;
  /** The ETag of the project the new one was made from. */
  etag: string;
  id: string;
}

interface DeleteProjectParams {
  /** The ETag of the project as the admin saw it. */
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
    queryFn: async ({ signal }): Promise<Tagged<Project>> => {
      const { data, etag } = await http.getWithETag({
        path: `/projects/${encodeURIComponent(id)}`,
        schema: projectResponseSchema,
        signal,
      });

      return { data: data.project, etag };
    },
    queryKey: [...projectsQueryKey, "item", id],
  });
}

/**
 * Creates a project at the top of the list and returns it as saved. Rejected with 422 when an
 * upload has expired.
 */
export async function createProject(body: ProjectBody): Promise<Project> {
  const { project } = await http.post({ path: "/projects", body, schema: projectResponseSchema });

  return project;
}

/**
 * Replaces the project, all its fields and photos at once, and returns it as saved with its new
 * ETag. Rejected with 412 when the project has changed since `etag` was read, with 404 when it was
 * deleted, and with 422 when it names a photo or an upload that no longer exists.
 */
export async function replaceProject({
  body,
  etag,
  id,
}: ReplaceProjectParams): Promise<Tagged<Project>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: `/projects/${encodeURIComponent(id)}`,
    body,
    etag,
    schema: projectResponseSchema,
  });

  return { data: data.project, etag: savedEtag };
}

/** Deletes the project with its photos. Rejected with 412 when it has changed since `etag` was read. */
export async function deleteProject({ etag, id }: DeleteProjectParams): Promise<void> {
  await http.deleteResourceIfMatch({ path: `/projects/${encodeURIComponent(id)}`, etag });
}
