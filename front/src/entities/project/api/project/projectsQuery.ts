import { queryOptions } from "@tanstack/react-query";

import { getProjects } from "./getProjects";
import { projectsQueryKey } from "./projectsQueryKey";

/** Every project in the order the site shows them. */
export const projectsQuery = queryOptions({
  queryFn: () => getProjects(),
  queryKey: [...projectsQueryKey, "list"],
});
