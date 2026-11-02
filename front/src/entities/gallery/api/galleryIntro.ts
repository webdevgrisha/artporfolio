import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type GalleryIntro, galleryIntroResponseSchema } from "../model/galleryIntro";

interface ReplaceGalleryIntroParams {
  /** The ETag of the text the new one was made from. */
  etag: string;
  intro: GalleryIntro;
}

/** The text above the works with its ETag. A save puts the saved text here. */
export const galleryIntroQuery = queryOptions({
  queryFn: async ({ signal }): Promise<Tagged<GalleryIntro>> => {
    const { data, etag } = await http.getWithETag({
      path: "/gallery-intro",
      schema: galleryIntroResponseSchema,
      signal,
    });

    return { data: data.intro, etag };
  },
  queryKey: ["gallery", "intro"],
});

/**
 * Replaces the text and returns it as saved by the server (trimmed) with its new ETag. Rejected
 * with 412 when the text has changed since `etag` was read, for example in another tab.
 */
export async function replaceGalleryIntro({
  etag,
  intro,
}: ReplaceGalleryIntroParams): Promise<Tagged<GalleryIntro>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/gallery-intro",
    body: intro,
    etag,
    schema: galleryIntroResponseSchema,
  });

  return { data: data.intro, etag: savedEtag };
}
