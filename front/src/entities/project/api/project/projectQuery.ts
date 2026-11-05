import { queryOptions } from "@tanstack/react-query";

import { getProject } from "./getProject";
import { projectsQueryKey } from "./projectsQueryKey";

/** One project with its ETag. A save puts the saved project here. */
export function projectQuery(id: string) {
  return queryOptions({
    queryFn: () => getProject(id),
    queryKey: [...projectsQueryKey, "item", id],
  });
}
