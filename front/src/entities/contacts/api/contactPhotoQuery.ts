import { queryOptions } from "@tanstack/react-query";

import { getContactPhoto } from "./getContactPhoto";

/** The contacts photo with its ETag. A save puts the saved photo here. */
export const contactPhotoQuery = queryOptions({
  queryFn: ({ signal }) => getContactPhoto({ signal }),
  queryKey: ["contacts", "photo"],
});
