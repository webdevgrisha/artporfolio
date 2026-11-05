import { http, type Tagged } from "@/shared/api/http";

import { type Project, projectSchema } from "../../model/project";
import { projectApiPath } from "./projectApiPath";
import type { ProjectBody } from "./projectBody";

interface CreateProjectParams {
  body: ProjectBody;
  /** A new UUID, which the client picks, so that a repeated request names the same project. */
  id: string;
}

/**
 * Creates the project `id` at the top of the list and returns it as saved with its ETag. Rejected
 * with 412 when the project exists, for example created by an earlier try whose response was lost,
 * and with 422 when an upload has expired.
 */
export function createProject({ body, id }: CreateProjectParams): Promise<Tagged<Project>> {
  return http.putIfNoneMatch({
    path: projectApiPath(id),
    body,
    schema: projectSchema,
  });
}
