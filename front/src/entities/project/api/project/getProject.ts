import { http, type Tagged } from "@/shared/api/http";

import { type Project, projectSchema } from "../../model/project";
import { projectApiPath } from "./projectApiPath";

/** The project with its ETag, which a change of it sends back. */
export function getProject(id: string): Promise<Tagged<Project>> {
  return http.getWithETag({ path: projectApiPath(id), schema: projectSchema });
}
