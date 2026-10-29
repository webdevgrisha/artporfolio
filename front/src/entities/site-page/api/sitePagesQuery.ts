import { queryOptions } from "@tanstack/react-query";

import { getSitePages } from "./getSitePages";

/** The pages of the public site as stored on the server. A save of a hero invalidates them. */
export const sitePagesQuery = queryOptions({
  queryFn: ({ signal }) => getSitePages({ signal }),
  queryKey: ["site-pages"],
});
