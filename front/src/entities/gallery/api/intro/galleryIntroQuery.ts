import { queryOptions } from "@tanstack/react-query";

import { getGalleryIntro } from "./getGalleryIntro";

/** The text above the works with its ETag. A save puts the saved text here. */
export const galleryIntroQuery = queryOptions({
  queryFn: () => getGalleryIntro(),
  queryKey: ["gallery", "intro"],
});
