import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  galleryCollectionQuery,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
  replaceGalleryCollection,
} from "@/entities/gallery";
import { getSaveCollectionErrorMessage } from "../lib/saveErrorMessages";
import type { CollectionFormValues } from "./collectionFormSchema";
import { toCollectionBody } from "./toCollectionBody";

interface SaveCollectionParams {
  /** The ETag of the collection the values were made from. */
  etag: string;
  values: CollectionFormValues;
}

/** The toasts of a collection form replace each other: a later save replaces an error. */
export const saveCollectionToastId = "gallery-collection-save";

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
