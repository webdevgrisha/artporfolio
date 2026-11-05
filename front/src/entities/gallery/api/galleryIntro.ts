import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type GalleryIntro, galleryIntroSchema } from "../model/galleryIntro";

interface ReplaceGalleryIntroParams {
  /** The ETag of the text the new one was made from. */
  etag: string;
  intro: GalleryIntro;
}

/** The text above the works with its ETag. A save puts the saved text here. */
export const galleryIntroQuery = queryOptions({
  queryFn: ({ signal }): Promise<Tagged<GalleryIntro>> =>
    http.getWithETag({
      path: "/gallery-intro",
      schema: galleryIntroSchema,
      signal,
    }),
  queryKey: ["gallery", "intro"],
});

/**
 * Replaces the text and returns it as saved by the server (trimmed) with its new ETag. Rejected
 * with 412 when the text has changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryIntro({
  etag,
  intro,
}: ReplaceGalleryIntroParams): Promise<Tagged<GalleryIntro>> {
  return http.putIfMatch({
    path: "/gallery-intro",
    body: intro,
    etag,
    schema: galleryIntroSchema,
  });
}
