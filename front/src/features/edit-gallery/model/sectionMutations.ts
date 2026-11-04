import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createGallerySection,
  type GallerySection,
  type GallerySectionBody,
  gallerySectionQuery,
  gallerySectionsQueryKey,
  replaceGallerySection,
} from "@/entities/gallery";
import { createOnce } from "@/shared/api/createOnce";

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
 * Creates a section from the form. A retry never doubles it (createOnce).
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

      const saved = await createOnce({
        create: () => createGallerySection({ body, id }),
        fetchEtag: async () =>
          (await queryClient.fetchQuery({ ...gallerySectionQuery(id), staleTime: 0 })).etag,
        replace: (etag) => replaceGallerySection({ body, etag, id }),
      });

      return saved.data;
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
