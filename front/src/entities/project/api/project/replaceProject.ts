import { http, type Tagged } from "@/shared/api/http";

import { type Project, projectSchema } from "../../model/project";
import { projectApiPath } from "./projectApiPath";
import type { ProjectBody } from "./projectBody";

interface ReplaceProjectParams {
  body: ProjectBody;
  /** The ETag of the project the new one was made from. */
  etag: string;
  id: string;
}

/**
 * Replaces the project, all its fields and photos at once, and returns it as saved with its new
 * ETag. Rejected with 412 when the project has changed since `etag` was read, with 404 when it was
 * deleted, and with 422 when it names a photo or an upload that no longer exists.
 */
export function replaceProject({ body, etag, id }: ReplaceProjectParams): Promise<Tagged<Project>> {
  return http.putIfMatch({
    path: projectApiPath(id),
    body,
    etag,
    schema: projectSchema,
  });
}
