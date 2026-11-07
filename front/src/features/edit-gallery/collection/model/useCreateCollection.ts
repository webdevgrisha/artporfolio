import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGalleryCollection,
  type GalleryCollection,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
} from "@/entities/gallery";
import { getCreateCollectionErrorMessage } from "../lib/saveErrorMessages";
import type { CollectionFormValues } from "./collectionFormSchema";
import { toCollectionBody } from "./toCollectionBody";
import { saveCollectionToastId } from "./useSaveCollection";

interface CreateCollectionParams {
  /** The id the form picked for the new collection; every try of the form sends the same one. */
  id: string;
  values: CollectionFormValues;
}

/**
 * Creates a collection from the form: uploads its cover, then sends the collection with its works
 * in one request, which the server saves all or nothing. A retry never doubles it: the server
 * refuses an id it already has with 412, and the form opens what is saved.
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateCollectionErrorMessage,
        successMessage: "Коллекция создана",
        toastId: saveCollectionToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateCollectionParams): Promise<GalleryCollection> => {
      const body = await toCollectionBody(values);

      return (await createGalleryCollection({ body, id })).data;
    },
    // The works of the collection may have come from other collections.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
      ]),
  });
}
