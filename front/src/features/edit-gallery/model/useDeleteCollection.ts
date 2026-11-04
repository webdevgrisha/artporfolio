import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";

import {
  deleteGalleryCollection,
  type GalleryCollection,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
} from "@/entities/gallery";

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
    mutationFn: ({ id }: GalleryCollection) => deleteGalleryCollection({ etag: "*", id }),
    mutationKey: deleteCollectionMutationKey,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
      ]),
  });
}

/** Whether the collection is being deleted, so that it is not deleted twice meanwhile. */
export function useIsDeletingCollection(id: string): boolean {
  const deletions = useMutationState({
    filters: {
      mutationKey: deleteCollectionMutationKey,
      predicate: (mutation) =>
        (mutation.state.variables as GalleryCollection | undefined)?.id === id,
      status: "pending",
    },
  });

  return deletions.length > 0;
}
