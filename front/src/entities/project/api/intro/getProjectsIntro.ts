import { http, type Tagged } from "@/shared/api/http";

import { type ProjectsIntro, projectsIntroSchema } from "../../model/projectsIntro";

/** The text with the ETag that a replacement of it sends back. */
export function getProjectsIntro(): Promise<Tagged<ProjectsIntro>> {
  return http.getWithETag({ path: "/projects/intro", schema: projectsIntroSchema });
}
