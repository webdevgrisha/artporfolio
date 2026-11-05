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
import { toPhotoBody } from "@/shared/lib/photoForm";
import { toPhotoListItems } from "@/shared/lib/photoListForm";

import { getCreateWorkErrorMessage, getSaveWorkErrorMessage } from "../../lib/saveErrorMessages";
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

/** Uploads the newly picked files, then gives the work as the server takes it. */
async function toWorkBody(values: WorkFormValues): Promise<GalleryWorkBody> {
  const {
    collectionId,
    colorIds,
    description,
    materialIds,
    month,
    paletteIds,
    photos,
    sectionIds,
    title,
    year,
  } = values;

  return {
    description,
    photo: await toPhotoBody(values),
    processPhotos: await toPhotoListItems(photos),
    sectionIds,
    materialIds,
    colorIds,
    paletteIds,
    published: values.published,
    collectionId: collectionId === "" ? null : collectionId,
    format: values.format,
    partCount: toPartCount(values),
    saleStatus: values.saleStatus,
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
 * A retry never doubles it: the server refuses
 * an id it already has with 412, and the form opens what is saved.
 */
export function useCreateWork() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateWorkErrorMessage,
        successMessage: "Работа создана",
        toastId: saveWorkToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateWorkParams): Promise<GalleryWork> => {
      const body = await toWorkBody(values);

      return (await createGalleryWork({ body, id })).data;
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
