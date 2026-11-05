import { queryOptions } from "@tanstack/react-query";

import { getAboutText } from "./getAboutText";

/** The About texts with their ETag. A save puts the saved texts here. */
export const aboutTextQuery = queryOptions({
  queryFn: () => getAboutText(),
  queryKey: ["about", "text"],
});
