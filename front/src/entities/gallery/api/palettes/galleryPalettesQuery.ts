import { queryOptions } from "@tanstack/react-query";

import { getGalleryPalettes } from "./getGalleryPalettes";

/** Every palette with the ETag of the list. A save puts the saved list here. */
export const galleryPalettesQuery = queryOptions({
  queryFn: () => getGalleryPalettes(),
  queryKey: ["gallery", "palettes"],
});
