import { http, type Tagged } from "@/shared/api/http";

import { type ProjectsIntro, projectsIntroSchema } from "../../model/projectsIntro";

interface ReplaceProjectsIntroParams {
  /** The ETag of the text the new one was made from. */
  etag: string;
  intro: ProjectsIntro;
}

/**
 * Replaces the text and returns it as saved by the server (trimmed) with its new ETag. Rejected
 * with 412 when the text has changed since `etag` was read, for example in another tab.
 */
export function replaceProjectsIntro({
  etag,
  intro,
}: ReplaceProjectsIntroParams): Promise<Tagged<ProjectsIntro>> {
  return http.putIfMatch({
    path: "/projects/intro",
    body: intro,
    etag,
    schema: projectsIntroSchema,
  });
}
