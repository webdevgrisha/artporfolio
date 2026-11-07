import { http, type Tagged } from "@/shared/api/http";
import type { TranslationsBody } from "@/shared/api/translations";

import { type GalleryIntro, galleryIntroSchema } from "../../model/galleryIntro";

interface ReplaceGalleryIntroParams {
  /** The ETag of the text the new one was made from. */
  etag: string;
  intro: {
    text: string;
    /** The text in the other languages; the server makes those sent as null. */
    translations: TranslationsBody;
  };
}

/**
 * Replaces the text and returns it as saved by the server (trimmed) with its new ETag. Rejected
 * with 412 when the text has changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryIntro({
  etag,
  intro,
}: ReplaceGalleryIntroParams): Promise<Tagged<GalleryIntro>> {
  return http.putIfMatch({
    path: "/gallery/intro",
    body: intro,
    etag,
    schema: galleryIntroSchema,
  });
}
