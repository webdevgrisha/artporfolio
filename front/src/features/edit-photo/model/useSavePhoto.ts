import { type PhotoSlot, saveSlotPhoto } from "@/shared/api/photoSlot";
import { useReplaceResource } from "@/shared/api/useReplaceResource";
import { type PhotoFormValues, toPhotoBody } from "@/shared/lib/photoForm";

import { getSavePhotoErrorMessage } from "../lib/saveErrorMessages";

interface SavePhotoParams {
  /** The ETag of the photo the values were made from. */
  etag: string;
  values: PhotoFormValues;
}

/** One toast for the saves of this photo: a later result replaces the previous one. */
export function getSavePhotoToastId({ path }: PhotoSlot): string {
  return `save ${path}`;
}

/**
 * Uploads a newly picked file, then replaces the photo of the slot. The server returns the saved
 * photo with its ETag, so the page need not load it again.
 */
export function useSavePhoto(slot: PhotoSlot) {
  return useReplaceResource({
    feedback: { getErrorMessage: getSavePhotoErrorMessage, toastId: getSavePhotoToastId(slot) },
    mutationFn: async ({ etag, values }: SavePhotoParams) =>
      saveSlotPhoto(slot, { body: await toPhotoBody(values), etag }),
    queryKey: slot.query.queryKey,
  });
}
