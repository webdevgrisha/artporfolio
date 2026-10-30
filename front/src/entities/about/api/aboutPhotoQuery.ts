import { queryOptions } from "@tanstack/react-query";

import { getAboutPhoto } from "./getAboutPhoto";

/** «Моё фото» with its ETag. A save puts the saved photo here. */
export const aboutPhotoQuery = queryOptions({
  queryFn: ({ signal }) => getAboutPhoto({ signal }),
  queryKey: ["about", "photo"],
});
