import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteGallerySection,
  type GallerySection,
  gallerySectionsQueryKey,
} from "@/entities/gallery";

import { usePendingIds } from "@/shared/lib/usePendingIds";

import { getDeleteSectionErrorMessage } from "../../lib/saveErrorMessages";

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
    mutationFn: ({ id }: GallerySection) => deleteGallerySection(id),
    mutationKey: deleteSectionMutationKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: gallerySectionsQueryKey }),
  });
}

/** The ids of the sections being deleted, so that none is deleted twice meanwhile. */
export function useDeletingSectionIds(): readonly string[] {
  return usePendingIds(deleteSectionMutationKey);
}
