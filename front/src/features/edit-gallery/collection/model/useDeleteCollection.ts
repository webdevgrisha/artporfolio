import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteGalleryCollection,
  type GalleryCollectionSummary,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
} from "@/entities/gallery";

import { usePendingIds } from "@/shared/lib/usePendingIds";

import { getDeleteCollectionErrorMessage } from "../lib/saveErrorMessages";

const deleteCollectionMutationKey = [...galleryCollectionsQueryKey, "delete"] as const;

/**
 * Deletes a collection with its cover, then loads the collections and the works again: its works
 * stay, each on its own. The list names the collection by its title, so the deletion applies to
 * whatever version is saved.
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getDeleteCollectionErrorMessage,
        successMessage: "Коллекция удалена",
        toastId: "gallery-collection-delete",
      },
    },
    mutationFn: ({ id }: GalleryCollectionSummary) => deleteGalleryCollection(id),
    mutationKey: deleteCollectionMutationKey,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
      ]),
  });
}

/** The ids of the collections being deleted, so that none is deleted twice meanwhile. */
export function useDeletingCollectionIds(): readonly string[] {
  return usePendingIds(deleteCollectionMutationKey);
}
