import { http, type Tagged } from "@/shared/api/http";

import { type Slideshow, slideshowSchema } from "../model/slideshow";

/** The slideshow with the ETag that a replacement of it sends back. */
export function getSlideshow(): Promise<Tagged<Slideshow>> {
  return http.getWithETag({
    path: "/contacts/slideshow",
    schema: slideshowSchema,
  });
}
