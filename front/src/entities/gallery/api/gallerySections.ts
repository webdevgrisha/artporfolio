import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import {
  type GallerySection,
  gallerySectionSchema,
  gallerySectionsResponseSchema,
  type Subsection,
} from "../model/gallerySection";

/** A section as the admin saves it: its title and the whole list of its subsections. */
export interface GallerySectionBody {
  title: string;
  /** In any order: the site shows them by title. A saved subsection left out is deleted. */
  subsections: readonly Subsection[];
}

interface CreateGallerySectionParams {
  body: GallerySectionBody;
  /** A new UUID, which the client picks, so that a repeated request names the same section. */
  id: string;
}

interface ReplaceGallerySectionParams {
  body: GallerySectionBody;
  /** The ETag of the section the new one was made from. */
  etag: string;
  id: string;
}

interface DeleteGallerySectionParams {
  /** The ETag of the section as the admin saw it, or `*` for whatever version is saved. */
  etag: string;
  id: string;
}

/** Every query of the sections starts with this key, so a change can refresh them all. */
export const gallerySectionsQueryKey = ["gallery", "sections"] as const;

function sectionPath(id: string): string {
  return `/gallery-sections/${encodeURIComponent(id)}`;
}

/** Every section, sorted by title. */
export const gallerySectionsQuery = queryOptions({
  queryFn: async ({ signal }): Promise<GallerySection[]> => {
    const { sections } = await http.get({
      path: "/gallery-sections",
      schema: gallerySectionsResponseSchema,
      signal,
    });

    return sections;
  },
  queryKey: [...gallerySectionsQueryKey, "list"],
});

/** One section with its ETag. A save puts the saved section here. */
export function gallerySectionQuery(id: string) {
  return queryOptions({
    queryFn: ({ signal }): Promise<Tagged<GallerySection>> =>
      http.getWithETag({
        path: sectionPath(id),
        schema: gallerySectionSchema,
        signal,
      }),
    queryKey: [...gallerySectionsQueryKey, "item", id],
  });
}

/**
 * Creates the section `id` and returns it as saved with its ETag. Rejected with 412 when the
 * section exists, for example created by an earlier try whose response was lost, and with 409
 * when another section has its title.
 */
export function createGallerySection({
  body,
  id,
}: CreateGallerySectionParams): Promise<Tagged<GallerySection>> {
  return http.putIfNoneMatch({
    path: sectionPath(id),
    body,
    schema: gallerySectionSchema,
  });
}

/**
 * Replaces the section with its subsections and returns it as saved with its new ETag. Rejected
 * with 412 when the section has changed since `etag` was read, with 404 when it was deleted, and
 * with 409 when another section has its title.
 */
export function replaceGallerySection({
  body,
  etag,
  id,
}: ReplaceGallerySectionParams): Promise<Tagged<GallerySection>> {
  return http.putIfMatch({
    path: sectionPath(id),
    body,
    etag,
    schema: gallerySectionSchema,
  });
}

/** Deletes the section with its subsections. Rejected with 412 when it has changed since `etag`. */
export async function deleteGallerySection({
  etag,
  id,
}: DeleteGallerySectionParams): Promise<void> {
  await http.deleteResourceIfMatch({ path: sectionPath(id), etag });
}
