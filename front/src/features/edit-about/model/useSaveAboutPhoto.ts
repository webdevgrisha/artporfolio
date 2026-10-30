import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery } from "@/entities/about";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { saveAboutPhoto } from "./saveAboutPhoto";

export const saveAboutPhotoFeedback: MutationFeedback = {
  getErrorMessage: getSavePhotoErrorMessage,
  toastId: "about-photo-save",
};

/**
 * Saves a change of «Моё фото», then loads the About page again. That happens after a failed save
 * too: a request that failed may still have changed the photo on the server.
 */
export function useSaveAboutPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveAboutPhotoFeedback },
    mutationFn: saveAboutPhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
