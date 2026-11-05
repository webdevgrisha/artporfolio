import { http, type Tagged } from "@/shared/api/http";

import { projectsOrderSchema } from "../../model/project";

interface ReplaceProjectsOrderParams {
  /** The ETag of the order the new one was made from. */
  etag: string;
  /** Every project, once, in the new order. */
  ids: readonly string[];
}

/**
 * Puts the projects in a new order and returns it with its new ETag. Rejected with 412 when the
 * order has changed since `etag` was read, and with 422 when `ids` does not name every project.
 */
export async function replaceProjectsOrder({
  etag,
  ids,
}: ReplaceProjectsOrderParams): Promise<Tagged<string[]>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/projects/order",
    body: { ids },
    etag,
    schema: projectsOrderSchema,
  });

  return { data: data.ids, etag: savedEtag };
}
