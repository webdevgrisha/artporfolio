import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gallerySectionQuery,
  gallerySectionsQuery,
  replaceGallerySection,
} from "@/entities/gallery";
import { putSavedResource } from "@/shared/api/savedResource";
import { getSaveSectionErrorMessage } from "../lib/saveErrorMessages";
import type { SectionFormValues } from "./sectionFormSchema";
import { toSectionBody } from "./toSectionBody";

interface SaveSectionParams {
  /** The ETag of the section the values were made from. */
  etag: string;
  values: SectionFormValues;
}

/** The toasts of a section form replace each other: a later save replaces an error. */
export const saveSectionToastId = "gallery-section-save";

/**
 * Replaces the section with the values of the form, then puts the saved section into the cache
 * and marks the list outdated. A failed save changed nothing on the server.
 */
export function useSaveSection(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = gallerySectionQuery(id);

  return useMutation({
    meta: {
      feedback: { getErrorMessage: getSaveSectionErrorMessage, toastId: saveSectionToastId },
    },
    mutationFn: ({ etag, values }: SaveSectionParams) =>
      replaceGallerySection({ body: toSectionBody(values), etag, id }),
    onSuccess: async (saved) => {
      await putSavedResource(queryClient, queryKey, saved);
      // The list loads afresh when it opens.
      await queryClient.invalidateQueries({
        queryKey: gallerySectionsQuery.queryKey,
        refetchType: "none",
      });
    },
  });
}
