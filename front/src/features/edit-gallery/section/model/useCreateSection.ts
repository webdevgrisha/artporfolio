import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGallerySection,
  type GallerySection,
  gallerySectionsQueryKey,
} from "@/entities/gallery";
import { getCreateSectionErrorMessage } from "../lib/saveErrorMessages";
import type { SectionFormValues } from "./sectionFormSchema";
import { toSectionBody } from "./toSectionBody";
import { saveSectionToastId } from "./useSaveSection";

interface CreateSectionParams {
  /** The id the form picked for the new section; every try of the form sends the same one. */
  id: string;
  values: SectionFormValues;
}

/**
 * Creates a section from the form. A retry never doubles it: the server refuses an id it already
 * has with 412, and the form opens what is saved.
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateSectionErrorMessage,
        successMessage: "Раздел создан",
        toastId: saveSectionToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateSectionParams): Promise<GallerySection> => {
      const body = toSectionBody(values);

      return (await createGallerySection({ body, id })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gallerySectionsQueryKey }),
  });
}
