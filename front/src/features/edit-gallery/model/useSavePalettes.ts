import { useMutation, useQueryClient } from "@tanstack/react-query";

import { galleryPalettesQuery, replaceGalleryPalettes } from "@/entities/gallery";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { getSavePalettesErrorMessage } from "../lib/saveErrorMessages";

export const savePalettesFeedback: MutationFeedback = {
  getErrorMessage: getSavePalettesErrorMessage,
  toastId: "gallery-palettes-save",
};

/**
 * Replaces every palette, then puts the saved list into the cache: the server returns it sorted,
 * with its ETag, so the page need not load it again.
 */
export function useSavePalettes() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: savePalettesFeedback },
    mutationFn: replaceGalleryPalettes,
    onSuccess: (saved) => queryClient.setQueryData(galleryPalettesQuery.queryKey, saved),
  });
}
