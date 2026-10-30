import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery, type ProcessPhoto } from "@/entities/about";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { getSaveProcessPhotosErrorMessage } from "../lib/saveErrorMessages";
import type { ProcessPhotosChanges } from "./processPhotosChanges";
import { saveProcessPhotos } from "./saveProcessPhotos";

export const saveProcessPhotosFeedback: MutationFeedback = {
  getErrorMessage: getSaveProcessPhotosErrorMessage,
  toastId: "process-photos-save",
};

interface SaveProcessPhotosVariables {
  changes: ProcessPhotosChanges;
  /** Gets each saved row with the photo the server returned. */
  onRowSaved: (index: number, photo: ProcessPhoto) => void;
}

/**
 * Saves the changes of the process photos, then loads the About page again. That happens after a
 * failed save too: a request that failed may still have changed the photos on the server.
 */
export function useSaveProcessPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveProcessPhotosFeedback },
    mutationFn: ({ changes, onRowSaved }: SaveProcessPhotosVariables) =>
      saveProcessPhotos(changes, onRowSaved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
