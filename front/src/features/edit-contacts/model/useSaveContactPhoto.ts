import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactPhotoQuery } from "@/entities/contacts";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { saveContactPhoto } from "./saveContactPhoto";

export const saveContactPhotoFeedback: MutationFeedback = {
  getErrorMessage: getSavePhotoErrorMessage,
  toastId: "contact-photo-save",
};

/**
 * Saves a change of the contacts photo, then puts the saved photo into the cache: the server returns it with
 * its ETag, so the page need not load it again.
 */
export function useSaveContactPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveContactPhotoFeedback },
    mutationFn: saveContactPhoto,
    onSuccess: (saved) => queryClient.setQueryData(contactPhotoQuery.queryKey, saved),
  });
}
