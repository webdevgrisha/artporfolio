import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  type GallerySection,
  gallerySectionQuery,
  galleryWorkUsageQuery,
  type WorkUsages,
} from "@/entities/gallery";
import type { LanguageFormSlot } from "@/entities/translation";
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
  /** Puts the form beside its translations. */
  languageForm: LanguageFormSlot;
  /** The section as stored on the server when the form opens, with its ETag. */
  section: Tagged<GallerySection>;
  /** How many works each section and subsection has, by its id. */
  usages: WorkUsages;
}

export function EditSectionForm({
  className,
  languageForm: LanguageForm,
  section,
  usages,
}: EditSectionFormProps) {
  const form = useForm<SectionFormValues>({
    defaultValues: toSectionFormValues(section.data),
    resolver: zodResolver(sectionFormSchema),
  });
  const saveSection = useSaveSection(section.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: section,
    query: gallerySectionQuery(section.data.id),
    related: [galleryWorkUsageQuery.queryKey],
    // The server replaces the section with all its subsections at once.
    save: (values, etag) => saveSection.mutateAsync({ etag, values }),
    toValues: toSectionFormValues,
    toastId: saveSectionToastId,
  });

  return (
    <LanguageForm
      savedTag={saved.etag}
      resource={`gallery-section-${section.data.id}`}
      fields={[
        { key: "title", label: "Название" },
        ...saved.data.subsections.map(({ id, title }) => ({ key: id, label: title })),
      ]}
    >
      {/* The fields read the form from the context. */}
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <SectionFields
            isSaving={editForm.isSaving}
            savedSubsections={saved.data.subsections}
            usages={usages}
          />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
