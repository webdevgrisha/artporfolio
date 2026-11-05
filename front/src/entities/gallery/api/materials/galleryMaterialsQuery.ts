import { queryOptions } from "@tanstack/react-query";

import { getGalleryMaterials } from "./getGalleryMaterials";

/** Every material with the ETag of the list. A save puts the saved list here. */
export const galleryMaterialsQuery = queryOptions({
  queryFn: () => getGalleryMaterials(),
  queryKey: ["gallery", "materials"],
});
