import { http, type Tagged } from "@/shared/api/http";

import { projectsOrderSchema } from "../../model/project";

/** The ids of the projects in the order the site shows them, with the ETag of that order. */
export async function getProjectsOrder(): Promise<Tagged<string[]>> {
  const { data, etag } = await http.getWithETag({
    path: "/projects/order",
    schema: projectsOrderSchema,
  });

  return { data: data.ids, etag };
}
