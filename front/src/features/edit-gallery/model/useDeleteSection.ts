import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";

import {
  deleteGallerySection,
  type GallerySection,
  gallerySectionsQueryKey,
} from "@/entities/gallery";

import { getDeleteSectionErrorMessage } from "../lib/saveErrorMessages";

const deleteSectionMutationKey = [...gallerySectionsQueryKey, "delete"] as const;

/**
 * Deletes a section with its subsections, then loads the sections again. The list names the
 * section by its title, so the deletion applies to whatever version is saved.
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getDeleteSectionErrorMessage,
        successMessage: "Раздел удалён",
        toastId: "gallery-section-delete",
      },
    },
    mutationFn: ({ id }: GallerySection) => deleteGallerySection({ etag: "*", id }),
    mutationKey: deleteSectionMutationKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: gallerySectionsQueryKey }),
  });
}

/** Whether the section is being deleted, so that it is not deleted twice meanwhile. */
export function useIsDeletingSection(id: string): boolean {
  const deletions = useMutationState({
    filters: {
      mutationKey: deleteSectionMutationKey,
      predicate: (mutation) => (mutation.state.variables as GallerySection | undefined)?.id === id,
      status: "pending",
    },
  });

  return deletions.length > 0;
}
