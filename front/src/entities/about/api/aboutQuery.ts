import { queryOptions } from "@tanstack/react-query";

import { getAbout } from "./getAbout";

/** The About page as stored on the server. A save of any of its parts invalidates it. */
export const aboutQuery = queryOptions({
  queryFn: ({ signal }) => getAbout({ signal }),
  queryKey: ["about"],
});
