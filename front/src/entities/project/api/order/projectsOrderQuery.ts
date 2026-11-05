import { queryOptions } from "@tanstack/react-query";

import { projectsQueryKey } from "../project/projectsQueryKey";
import { getProjectsOrder } from "./getProjectsOrder";

/** The order of the projects with its ETag. A save puts the saved order here. */
export const projectsOrderQuery = queryOptions({
  queryFn: () => getProjectsOrder(),
  queryKey: [...projectsQueryKey, "order"],
});
