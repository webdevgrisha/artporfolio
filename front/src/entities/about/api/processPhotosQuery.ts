import { queryOptions } from "@tanstack/react-query";

import { getProcessPhotos } from "./getProcessPhotos";

/** The process photos with the ETag of their list. A save puts the saved list here. */
export const processPhotosQuery = queryOptions({
  queryFn: ({ signal }) => getProcessPhotos({ signal }),
  queryKey: ["about", "process-photos"],
});
