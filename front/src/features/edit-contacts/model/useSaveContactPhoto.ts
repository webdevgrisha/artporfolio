import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { saveContactPhoto } from "./saveContactPhoto";

export const saveContactPhotoFeedback: MutationFeedback = {
  getErrorMessage: getSavePhotoErrorMessage,
  toastId: "contact-photo-save",
};

/**
 * Saves a change of the photo, then loads the contacts again. That happens after a failed save
 * too: a request that failed may still have changed the photo on the server.
 */
export function useSaveContactPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveContactPhotoFeedback },
    mutationFn: saveContactPhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: contactsQuery.queryKey }),
  });
}
