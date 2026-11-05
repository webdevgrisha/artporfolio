import { http, type Tagged } from "@/shared/api/http";

import { type AboutText, aboutTextSchema } from "../model/aboutText";

/** The texts with their ETag, which a replacement of the texts sends back. */
export function getAboutText(): Promise<Tagged<AboutText>> {
  return http.getWithETag({
    path: "/about/text",
    schema: aboutTextSchema,
  });
}
