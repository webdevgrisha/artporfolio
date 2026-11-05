import { queryOptions } from "@tanstack/react-query";

import { getProjectsIntro } from "./getProjectsIntro";

/** The text above the projects with its ETag. A save puts the saved text here. */
export const projectsIntroQuery = queryOptions({
  queryFn: () => getProjectsIntro(),
  queryKey: ["projects", "intro"],
});
