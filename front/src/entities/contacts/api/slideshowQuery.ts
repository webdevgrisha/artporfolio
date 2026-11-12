import { queryOptions } from "@tanstack/react-query";

import { getSlideshow } from "./getSlideshow";

/** The slideshow with its ETag. A save puts the saved slideshow here. */
export const slideshowQuery = queryOptions({
  queryFn: () => getSlideshow(),
  queryKey: ["contacts", "slideshow"],
});
