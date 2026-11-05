import { queryOptions } from "@tanstack/react-query";

import { getGalleryColors } from "./getGalleryColors";

/** Every color with the ETag of the list. A save puts the saved list here. */
export const galleryColorsQuery = queryOptions({
  queryFn: () => getGalleryColors(),
  queryKey: ["gallery", "colors"],
});
