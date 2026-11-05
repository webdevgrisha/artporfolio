import { http, type Tagged } from "@/shared/api/http";

import { type AboutText, aboutTextSchema } from "../model/aboutText";

interface GetAboutTextParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** The texts with their ETag, which a replacement of the texts sends back. */
export function getAboutText({ signal }: GetAboutTextParams): Promise<Tagged<AboutText>> {
  return http.getWithETag({
    path: "/about/text",
    schema: aboutTextSchema,
    signal,
  });
}
