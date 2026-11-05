import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import {
  type GalleryCollection,
  galleryCollectionSchema,
  galleryCollectionsResponseSchema,
} from "../model/galleryCollection";

/** A collection as the admin saves it: every field and its works at once. */
export interface GalleryCollectionBody {
  title: string;
  description: string;
  /** A new file by its upload (see `uploadImage`), or the saved file when `uploadId` is left out. */
  cover: { alt: string; uploadId?: string };
  startYear: number;
  /** Null for a collection of one year. */
  endYear: number | null;
  /**
   * Every work of the collection, in any order. A work of another collection moves to this one; a
   * saved work left out becomes a work on its own.
   */
  workIds: readonly string[];
}

interface CreateGalleryCollectionParams {
  body: GalleryCollectionBody;
  /** A new UUID, which the client picks, so that a repeated request names the same collection. */
  id: string;
}

interface ReplaceGalleryCollectionParams {
  body: GalleryCollectionBody;
  /** The ETag of the collection the new one was made from. */
  etag: string;
  id: string;
}

interface DeleteGalleryCollectionParams {
  /** The ETag of the collection as the admin saw it, or `*` for whatever version is saved. */
  etag: string;
  id: string;
}

/** Every query of the collections starts with this key, so a change can refresh them all. */
export const galleryCollectionsQueryKey = ["gallery", "collections"] as const;

function collectionPath(id: string): string {
  return `/gallery-collections/${encodeURIComponent(id)}`;
}

/** Every collection in the order the site shows them. */
export const galleryCollectionsQuery = queryOptions({
  queryFn: async ({ signal }): Promise<GalleryCollection[]> => {
    const { collections } = await http.get({
      path: "/gallery-collections",
      schema: galleryCollectionsResponseSchema,
      signal,
    });

    return collections;
  },
  queryKey: [...galleryCollectionsQueryKey, "list"],
});

/** One collection with its ETag. A save puts the saved collection here. */
export function galleryCollectionQuery(id: string) {
  return queryOptions({
    queryFn: ({ signal }): Promise<Tagged<GalleryCollection>> =>
      http.getWithETag({
        path: collectionPath(id),
        schema: galleryCollectionSchema,
        signal,
      }),
    queryKey: [...galleryCollectionsQueryKey, "item", id],
  });
}

/**
 * Creates the collection `id` with its works and returns it as saved with its ETag. Rejected with
 * 412 when the collection exists, for example created by an earlier try whose response was lost,
 * with 409 when another collection has its title, and with 422 when the upload of the cover has
 * expired or a work no longer exists.
 */
export function createGalleryCollection({
  body,
  id,
}: CreateGalleryCollectionParams): Promise<Tagged<GalleryCollection>> {
  return http.putIfNoneMatch({
    path: collectionPath(id),
    body,
    schema: galleryCollectionSchema,
  });
}

/**
 * Replaces the collection and its works and returns it as saved with its new ETag. Rejected with
 * 412 when the collection or its works have changed since `etag` was read, with 404 when it was
 * deleted, with 409 when another collection has its title, and with 422 when the upload of the
 * cover has expired or a work no longer exists.
 */
export function replaceGalleryCollection({
  body,
  etag,
  id,
}: ReplaceGalleryCollectionParams): Promise<Tagged<GalleryCollection>> {
  return http.putIfMatch({
    path: collectionPath(id),
    body,
    etag,
    schema: galleryCollectionSchema,
  });
}

/**
 * Deletes the collection with its cover; its works stay, each on its own. Rejected with 412 when
 * it has changed since `etag` was read.
 */
export async function deleteGalleryCollection({
  etag,
  id,
}: DeleteGalleryCollectionParams): Promise<void> {
  await http.deleteResourceIfMatch({ path: collectionPath(id), etag });
}
