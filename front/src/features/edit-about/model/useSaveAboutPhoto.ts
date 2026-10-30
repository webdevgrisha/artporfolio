import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutPhotoQuery } from "@/entities/about";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { saveAboutPhoto } from "./saveAboutPhoto";

export const saveAboutPhotoFeedback: MutationFeedback = {
  getErrorMessage: getSavePhotoErrorMessage,
  toastId: "about-photo-save",
};

/**
 * Saves a change of «Моё фото», then puts the saved photo into the cache: the server returns it with
 * its ETag, so the page need not load it again.
 */
export function useSaveAboutPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveAboutPhotoFeedback },
    mutationFn: saveAboutPhoto,
    onSuccess: (saved) => queryClient.setQueryData(aboutPhotoQuery.queryKey, saved),
  });
}
