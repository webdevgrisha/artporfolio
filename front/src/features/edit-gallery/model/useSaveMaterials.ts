import { useMutation, useQueryClient } from "@tanstack/react-query";

import { galleryMaterialsQuery, replaceGalleryMaterials } from "@/entities/gallery";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { getSaveMaterialsErrorMessage } from "../lib/saveErrorMessages";

export const saveMaterialsFeedback: MutationFeedback = {
  getErrorMessage: getSaveMaterialsErrorMessage,
  toastId: "gallery-materials-save",
};

/**
 * Replaces every material, then puts the saved list into the cache: the server returns it sorted,
 * with its ETag, so the page need not load it again.
 */
export function useSaveMaterials() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveMaterialsFeedback },
    mutationFn: replaceGalleryMaterials,
    onSuccess: (saved) => queryClient.setQueryData(galleryMaterialsQuery.queryKey, saved),
  });
}
