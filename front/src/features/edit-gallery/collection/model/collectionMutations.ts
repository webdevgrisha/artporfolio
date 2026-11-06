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
import { toPhotoBody } from "@/shared/lib/photoForm";
import { toTranslationsBody } from "@/shared/lib/translationsForm";

import {
  getCreateCollectionErrorMessage,
  getSaveCollectionErrorMessage,
} from "../lib/saveErrorMessages";
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

/** Uploads a newly picked cover, then gives the collection as the server takes it. */
async function toCollectionBody(values: CollectionFormValues): Promise<GalleryCollectionBody> {
  const { description, endYear, startYear, title, workIds } = values;

  return {
    cover: await toPhotoBody(values),
    description,
    endYear: endYear.trim() ? Number(endYear) : null,
    startYear: Number(startYear),
    title,
    workIds,
    translations: toTranslationsBody(values.translations),
  };
}

/** The toasts of a collection form replace each other: a later save replaces an error. */
export const saveCollectionToastId = "gallery-collection-save";

/**
 * Creates a collection from the form: uploads its cover, then sends the collection with its works
 * in one request, which the server saves all or nothing.
 * A retry never doubles it: the server refuses
 * an id it already has with 412, and the form opens what is saved.
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateCollectionErrorMessage,
        successMessage: "Коллекция создана",
        toastId: saveCollectionToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateCollectionParams): Promise<GalleryCollection> => {
      const body = await toCollectionBody(values);

      return (await createGalleryCollection({ body, id })).data;
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
