import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteGalleryWork,
  type GalleryWorkSummary,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
} from "@/entities/gallery";

import { usePendingIds } from "@/shared/lib/usePendingIds";

import { getDeleteWorkErrorMessage } from "../lib/saveErrorMessages";

const deleteWorkMutationKey = [...galleryWorksQueryKey, "delete"] as const;

/**
 * Deletes a work with its photo, then loads the works and the collections again: the work leaves
 * its collection. The list names the work by its title,
 * so the deletion applies to whatever version is saved.
 */
export function useDeleteWork() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getDeleteWorkErrorMessage,
        successMessage: "Работа удалена",
        toastId: "gallery-work-delete",
      },
    },
    mutationFn: ({ id }: GalleryWorkSummary) => deleteGalleryWork(id),
    mutationKey: deleteWorkMutationKey,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
      ]),
  });
}

/** The ids of the works being deleted, so that none is deleted twice meanwhile. */
export function useDeletingWorkIds(): readonly string[] {
  return usePendingIds(deleteWorkMutationKey);
}
