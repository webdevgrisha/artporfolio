import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createGallerySection,
  type GallerySection,
  type GallerySectionBody,
  gallerySectionQuery,
  gallerySectionsQueryKey,
  replaceGallerySection,
} from "@/entities/gallery";
import { HttpError } from "@/shared/api/httpError";

import { getSaveSectionErrorMessage } from "../lib/saveErrorMessages";
import type { SectionFormValues } from "./sectionFormSchema";

interface CreateSectionParams {
  /** The id the form picked for the new section; every try of the form sends the same one. */
  id: string;
  values: SectionFormValues;
}

interface SaveSectionParams {
  /** The ETag of the section the values were made from. */
  etag: string;
  values: SectionFormValues;
}

/** The section as the server takes it; the schema of the form has trimmed the titles. */
function toSectionBody({ subsections, title }: SectionFormValues): GallerySectionBody {
  return { subsections, title };
}

/** The toasts of a section form replace each other: a later save replaces an error. */
export const saveSectionToastId = "gallery-section-save";

/**
 * Creates a section from the form. A try may create the section even though its response is
 * lost; the next try then finds it there (412) and saves the values into it, so the section is
 * neither lost nor doubled.
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getSaveSectionErrorMessage,
        successMessage: "Раздел создан",
        toastId: saveSectionToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateSectionParams): Promise<GallerySection> => {
      const body = toSectionBody(values);

      try {
        return (await createGallerySection({ body, id })).data;
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 412)) throw error;
      }

      const { etag } = await queryClient.fetchQuery({ ...gallerySectionQuery(id), staleTime: 0 });

      return (await replaceGallerySection({ body, etag, id })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gallerySectionsQueryKey }),
  });
}

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
      queryClient.setQueryData(queryKey, saved);
      // The list loads afresh when it opens.
      await queryClient.invalidateQueries({
        queryKey: gallerySectionsQueryKey,
        refetchType: "none",
      });
    },
  });
}
