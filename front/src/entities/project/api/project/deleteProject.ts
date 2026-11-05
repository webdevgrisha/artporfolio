import { http } from "@/shared/api/http";

import { projectApiPath } from "./projectApiPath";

/** Deletes the project with its photos. */
export function deleteProject(id: string): Promise<void> {
  return http.deleteResource({ path: projectApiPath(id) });
}
