import { http, type Tagged } from "@/shared/api/http";

import { type AboutText, aboutTextResponseSchema } from "../model/aboutText";

interface GetAboutTextParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** The texts with their ETag, which a replacement of the texts sends back. */
export async function getAboutText({ signal }: GetAboutTextParams): Promise<Tagged<AboutText>> {
  const { data, etag } = await http.getWithETag({
    path: "/about/text",
    schema: aboutTextResponseSchema,
    signal,
  });

  return { data: data.text, etag };
}
