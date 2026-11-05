import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type ProjectsIntro, projectsIntroSchema } from "../model/projectsIntro";

interface ReplaceProjectsIntroParams {
  /** The ETag of the text the new one was made from. */
  etag: string;
  intro: ProjectsIntro;
}

/** The text above the projects with its ETag. A save puts the saved text here. */
export const projectsIntroQuery = queryOptions({
  queryFn: (): Promise<Tagged<ProjectsIntro>> =>
    http.getWithETag({
      path: "/projects-intro",
      schema: projectsIntroSchema,
    }),
  queryKey: ["projects", "intro"],
});

/**
 * Replaces the text and returns it as saved by the server (trimmed) with its new ETag. Rejected
 * with 412 when the text has changed since `etag` was read, for example in another tab.
 */
export function replaceProjectsIntro({
  etag,
  intro,
}: ReplaceProjectsIntroParams): Promise<Tagged<ProjectsIntro>> {
  return http.putIfMatch({
    path: "/projects-intro",
    body: intro,
    etag,
    schema: projectsIntroSchema,
  });
}
