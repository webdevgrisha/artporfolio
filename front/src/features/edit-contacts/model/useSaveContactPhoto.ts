import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";

import { saveContactPhoto } from "./saveContactPhoto";

/**
 * Saves a change of the photo, then loads the contacts again. That happens after a failed save
 * too: a request that failed may still have changed the photo on the server.
 */
export function useSaveContactPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveContactPhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: contactsQuery.queryKey }),
  });
}
