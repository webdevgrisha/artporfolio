import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createGalleryWork,
  type GalleryWork,
  type GalleryWorkBody,
  galleryCollectionsQueryKey,
  galleryWorkQuery,
  galleryWorksQueryKey,
  replaceGalleryWork,
} from "@/entities/gallery";
import { createOnce } from "@/shared/api/createOnce";
import { uploadImage } from "@/shared/api/upload";
import { toPhotoListItems } from "@/shared/lib/photoListForm";

import { getSaveWorkErrorMessage } from "../lib/saveErrorMessages";
import { toPartCount, toWorkSize, type WorkFormValues } from "./workFormSchema";
import { toWorkPrice } from "./workPrice";

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
  const {
    collectionId,
    colorIds,
    description,
    materialIds,
    month,
    paletteIds,
    photo,
    photoAlt,
    photos,
    sectionIds,
    title,
    year,
  } = values;

  return {
    description,
    photo:
      photo instanceof File
        ? { alt: photoAlt, uploadId: await uploadImage(photo) }
        : { alt: photoAlt },
    processPhotos: await toPhotoListItems(photos),
    sectionIds,
    materialIds,
    colorIds,
    paletteIds,
    collectionId: collectionId === "" ? null : collectionId,
    format: values.format,
    partCount: toPartCount(values),
    price: toWorkPrice(values),
    size: toWorkSize(values),
    title,
    year: Number(year),
    month: Number(month),
    country: values.country === "" ? null : values.country,
    city: values.city,
  };
}

/** The toasts of a work form replace each other: a later save replaces an error. */
export const saveWorkToastId = "gallery-work-save";

/**
 * Creates a work from the form: uploads its photos, then sends the work in one request, which the
 * server saves all or nothing.
 * A retry never doubles it (createOnce).
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

      const saved = await createOnce({
        create: () => createGalleryWork({ body, id }),
        fetchEtag: async () =>
          (await queryClient.fetchQuery({ ...galleryWorkQuery(id), staleTime: 0 })).etag,
        replace: (etag) => replaceGalleryWork({ body, etag, id }),
      });

      return saved.data;
    },
    // A work in a collection changes the works of that collection too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
      ]),
  });
}

/**
 * Replaces the work with the values of the form, then puts the saved work into the cache and marks
 * the lists outdated. A failed save changed nothing on the server.
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
      // The lists load afresh when they open; moving the work changes the works of its collections.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey, refetchType: "none" }),
        queryClient.invalidateQueries({
          queryKey: galleryCollectionsQueryKey,
          refetchType: "none",
        }),
      ]);
    },
  });
}
