import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";
import type { ListPhotoItem } from "@/shared/api/photo";

import {
  type GalleryWork,
  galleryWorkResponseSchema,
  galleryWorksResponseSchema,
  type WorkFormat,
  type WorkPrice,
  type WorkSize,
} from "../model/galleryWork";

/** A work as the admin saves it: every field at once. */
export interface GalleryWorkBody {
  title: string;
  description: string;
  size: WorkSize;
  year: number;
  /** 1 for January. */
  month: number;
  /** Where the work was made; an empty string for none. */
  place: string;
  /** A new file by its upload (see `uploadImage`), or the saved file when `uploadId` is left out. */
  photo: { alt: string; uploadId?: string };
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: readonly ListPhotoItem[];
  /** The sections and subsections the work is shown in, at least one. */
  sectionIds: readonly string[];
  /** The materials the work is made of, at least one. */
  materialIds: readonly string[];
  /** The colors a visitor finds the work by, at least one. */
  colorIds: readonly string[];
  /** The coloring of the work as a whole, at least one palette. */
  paletteIds: readonly string[];
  /** The collection the work was painted for, or null for a work on its own. */
  collectionId: string | null;
  format: WorkFormat;
  /** How many works the set has; null for any other format. */
  partCount: number | null;
  /** Null for a work without a price; the server computes the amount after the discount. */
  price: Omit<WorkPrice, "finalAmount"> | null;
}

interface CreateGalleryWorkParams {
  body: GalleryWorkBody;
  /** A new UUID, which the client picks, so that a repeated request names the same work. */
  id: string;
}

interface ReplaceGalleryWorkParams {
  body: GalleryWorkBody;
  /** The ETag of the work the new one was made from. */
  etag: string;
  id: string;
}

interface DeleteGalleryWorkParams {
  /** The ETag of the work as the admin saw it, or `*` for whatever version is saved. */
  etag: string;
  id: string;
}

/** Every query of the works starts with this key, so a change can refresh them all. */
export const galleryWorksQueryKey = ["gallery", "works"] as const;

function workPath(id: string): string {
  return `/gallery-works/${encodeURIComponent(id)}`;
}

/** Every work in the order the site shows them. */
export const galleryWorksQuery = queryOptions({
  queryFn: async ({ signal }): Promise<GalleryWork[]> => {
    const { works } = await http.get({
      path: "/gallery-works",
      schema: galleryWorksResponseSchema,
      signal,
    });

    return works;
  },
  queryKey: [...galleryWorksQueryKey, "list"],
});

/** One work with its ETag. A save puts the saved work here. */
export function galleryWorkQuery(id: string) {
  return queryOptions({
    queryFn: async ({ signal }): Promise<Tagged<GalleryWork>> => {
      const { data, etag } = await http.getWithETag({
        path: workPath(id),
        schema: galleryWorkResponseSchema,
        signal,
      });

      return { data: data.work, etag };
    },
    queryKey: [...galleryWorksQueryKey, "item", id],
  });
}

/**
 * Creates the work `id` and returns it as saved with its ETag. Rejected with 412 when the work
 * exists, for example created by an earlier try whose response was lost, and with 422 when the
 * upload of a photo has expired or a section or the collection no longer exists.
 */
export async function createGalleryWork({
  body,
  id,
}: CreateGalleryWorkParams): Promise<Tagged<GalleryWork>> {
  const { data, etag } = await http.putIfNoneMatch({
    path: workPath(id),
    body,
    schema: galleryWorkResponseSchema,
  });

  return { data: data.work, etag };
}

/**
 * Replaces the work, all its fields at once, and returns it as saved with its new ETag. Rejected
 * with 412 when the work has changed since `etag` was read, with 404 when it was deleted, and with
 * 422 when it names a process photo, an upload, a section or a collection that no longer exists.
 */
export async function replaceGalleryWork({
  body,
  etag,
  id,
}: ReplaceGalleryWorkParams): Promise<Tagged<GalleryWork>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: workPath(id),
    body,
    etag,
    schema: galleryWorkResponseSchema,
  });

  return { data: data.work, etag: savedEtag };
}

/** Deletes the work with its photos. Rejected with 412 when it has changed since `etag` was read. */
export async function deleteGalleryWork({ etag, id }: DeleteGalleryWorkParams): Promise<void> {
  await http.deleteResourceIfMatch({ path: workPath(id), etag });
}
