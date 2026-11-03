import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createGalleryWork,
  type GalleryWork,
  type GalleryWorkBody,
  galleryWorkQuery,
  galleryWorksQueryKey,
  replaceGalleryWork,
} from "@/entities/gallery";
import { HttpError } from "@/shared/api/httpError";
import { uploadImage } from "@/shared/api/upload";
import { toPhotoListItems } from "@/shared/lib/photoListForm";

import { getSaveWorkErrorMessage } from "../lib/saveErrorMessages";
import { toWorkSize, type WorkFormValues } from "./workFormSchema";

interface CreateWorkParams {
  /** The id the form picked for the new work; every try of the form sends the same one. */
  id: string;
  values: WorkFormValues;
}

interface SaveWorkParams {
  /** The ETag of the work the values were made from. */
  etag: string;
  values: WorkFormValues;
}

/**
 * Uploads the newly picked files, then gives the work as the server takes it; a saved photo keeps
 * its file and sends its description alone. Rejects with `UploadError`.
 */
async function toWorkBody(values: WorkFormValues): Promise<GalleryWorkBody> {
  const { description, month, photo, photoAlt, photos, title, year } = values;

  return {
    description,
    photo:
      photo instanceof File
        ? { alt: photoAlt, uploadId: await uploadImage(photo) }
        : { alt: photoAlt },
    processPhotos: await toPhotoListItems(photos),
    size: toWorkSize(values),
    title,
    year: Number(year),
    month: Number(month),
  };
}

/** The toasts of a work form replace each other: a later save replaces an error. */
export const saveWorkToastId = "gallery-work-save";

/**
 * Creates a work from the form: uploads its photos, then sends the work in one request, which the
 * server saves all or nothing.
 *
 * A try may create the work even though its response is lost. The next try then finds the work
 * there (412) and saves the values into it, so the work is neither lost nor doubled.
 */
export function useCreateWork() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getSaveWorkErrorMessage,
        successMessage: "Работа создана",
        toastId: saveWorkToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateWorkParams): Promise<GalleryWork> => {
      const body = await toWorkBody(values);

      try {
        return (await createGalleryWork({ body, id })).data;
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 412)) throw error;
      }

      const { etag } = await queryClient.fetchQuery({ ...galleryWorkQuery(id), staleTime: 0 });

      return (await replaceGalleryWork({ body, etag, id })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
  });
}

/**
 * Replaces the work with the values of the form, then puts the saved work into the cache and marks
 * the list outdated. A failed save changed nothing on the server.
 */
export function useSaveWork(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = galleryWorkQuery(id);

  return useMutation({
    meta: {
      feedback: { getErrorMessage: getSaveWorkErrorMessage, toastId: saveWorkToastId },
    },
    mutationFn: async ({ etag, values }: SaveWorkParams) =>
      replaceGalleryWork({ body: await toWorkBody(values), etag, id }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(queryKey, saved);
      // The list loads afresh when it opens.
      await queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey, refetchType: "none" });
    },
  });
}
