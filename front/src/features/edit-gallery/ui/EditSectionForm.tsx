import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  type GallerySection,
  type GalleryWork,
  gallerySectionQuery,
  galleryWorksQuery,
} from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type SectionFormValues,
  sectionFormSchema,
  toSectionFormValues,
} from "../model/sectionFormSchema";
import { saveSectionToastId, useSaveSection } from "../model/sectionMutations";
import { SectionFields } from "./SectionFields";

interface EditSectionFormProps {
  className?: string;
  /** The section as stored on the server when the form opens, with its ETag. */
  section: Tagged<GallerySection>;
  /** Every work, to count the works in each subsection. */
  works: readonly GalleryWork[];
}

export function EditSectionForm({ className, section, works }: EditSectionFormProps) {
  const form = useForm<SectionFormValues>({
    defaultValues: toSectionFormValues(section.data),
    resolver: zodResolver(sectionFormSchema),
  });
  const saveSection = useSaveSection(section.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: section,
    query: gallerySectionQuery(section.data.id),
    related: [galleryWorksQuery.queryKey],
    // The server replaces the section with all its subsections at once.
    save: (values, etag) => saveSection.mutateAsync({ etag, values }),
    toValues: toSectionFormValues,
    toastId: saveSectionToastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <SectionFields
          isSaving={editForm.isSaving}
          savedSubsections={saved.data.subsections}
          works={works}
        />
      </EditForm>
    </FormProvider>
  );
}
