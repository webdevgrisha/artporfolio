import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createGalleryCollection,
  type GalleryCollection,
  type GalleryCollectionBody,
  galleryCollectionQuery,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
  replaceGalleryCollection,
} from "@/entities/gallery";
import { createOnce } from "@/shared/api/createOnce";
import { uploadImage } from "@/shared/api/upload";

import { getSaveCollectionErrorMessage } from "../lib/saveErrorMessages";
import type { CollectionFormValues } from "./collectionFormSchema";

interface CreateCollectionParams {
  /** The id the form picked for the new collection; every try of the form sends the same one. */
  id: string;
  values: CollectionFormValues;
}

interface SaveCollectionParams {
  /** The ETag of the collection the values were made from. */
  etag: string;
  values: CollectionFormValues;
}

/**
 * Uploads a newly picked cover, then gives the collection as the server takes it; a saved cover
 * keeps its file and sends its description alone. Rejects with `UploadError`.
 */
async function toCollectionBody({
  description,
  endYear,
  photo,
  photoAlt,
  startYear,
  title,
  workIds,
}: CollectionFormValues): Promise<GalleryCollectionBody> {
  return {
    cover:
      photo instanceof File
        ? { alt: photoAlt, uploadId: await uploadImage(photo) }
        : { alt: photoAlt },
    description,
    endYear: endYear.trim() ? Number(endYear) : null,
    startYear: Number(startYear),
    title,
    workIds,
  };
}

/** The toasts of a collection form replace each other: a later save replaces an error. */
export const saveCollectionToastId = "gallery-collection-save";

/**
 * Creates a collection from the form: uploads its cover, then sends the collection with its works
 * in one request, which the server saves all or nothing.
 * A retry never doubles it (createOnce).
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getSaveCollectionErrorMessage,
        successMessage: "Коллекция создана",
        toastId: saveCollectionToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateCollectionParams): Promise<GalleryCollection> => {
      const body = await toCollectionBody(values);

      const saved = await createOnce({
        create: () => createGalleryCollection({ body, id }),
        fetchEtag: async () =>
          (await queryClient.fetchQuery({ ...galleryCollectionQuery(id), staleTime: 0 })).etag,
        replace: (etag) => replaceGalleryCollection({ body, etag, id }),
      });

      return saved.data;
    },
    // The works of the collection may have come from other collections.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
      ]),
  });
}

/**
 * Replaces the collection and its works with the values of the form, then puts the saved
 * collection into the cache and marks the lists outdated. A failed save changed nothing on the
 * server.
 */
export function useSaveCollection(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = galleryCollectionQuery(id);

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getSaveCollectionErrorMessage,
        toastId: saveCollectionToastId,
      },
    },
    mutationFn: async ({ etag, values }: SaveCollectionParams) =>
      replaceGalleryCollection({ body: await toCollectionBody(values), etag, id }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(queryKey, saved);
      // The lists load afresh when they open; a moved work changes another collection and itself.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: galleryCollectionsQueryKey,
          refetchType: "none",
        }),
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey, refetchType: "none" }),
      ]);
    },
  });
}
