import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";

import { deleteGalleryWork, type GalleryWork, galleryWorksQueryKey } from "@/entities/gallery";

import { getDeleteWorkErrorMessage } from "../lib/saveErrorMessages";

const deleteWorkMutationKey = [...galleryWorksQueryKey, "delete"] as const;

/**
 * Deletes a work with its photo, then loads the works again. The list names the work by its title,
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
    mutationFn: ({ id }: GalleryWork) => deleteGalleryWork({ etag: "*", id }),
    mutationKey: deleteWorkMutationKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
  });
}

/** Whether the work is being deleted, so that it is not deleted twice meanwhile. */
export function useIsDeletingWork(id: string): boolean {
  const deletions = useMutationState({
    filters: {
      mutationKey: deleteWorkMutationKey,
      predicate: (mutation) => (mutation.state.variables as GalleryWork | undefined)?.id === id,
      status: "pending",
    },
  });

  return deletions.length > 0;
}
