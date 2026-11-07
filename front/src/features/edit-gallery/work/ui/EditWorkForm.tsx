import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type GalleryWork, galleryWorkQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { LanguageForm } from "@/shared/ui/language-form";
import { type WorkReferences, workReferenceQueries } from "../model/useWorkReferences";
import { type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { toWorkFormValues } from "../model/workFormValues";
import { saveWorkToastId, useSaveWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";

/** The texts of a work a person can edit in every language. */
const languageFields = [
  { key: "title", label: "Название" },
  { key: "description", label: "Описание", multiline: true },
  { key: "city", label: "Город" },
  { key: "alt", label: "Описание фото" },
];

interface EditWorkFormProps {
  className?: string;
  /** The work as stored on the server when the form opens, with its ETag. */
  work: Tagged<GalleryWork>;
  /** The lists of the gallery to choose from. */
  references: WorkReferences;
}

export function EditWorkForm({ className, references, work }: EditWorkFormProps) {
  const form = useForm<WorkFormValues>({
    defaultValues: toWorkFormValues(work.data),
    resolver: zodResolver(workFormSchema),
  });
  const saveWork = useSaveWork(work.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: work,
    query: galleryWorkQuery(work.data.id),
    related: workReferenceQueries.map((query) => query.queryKey),
    // The server replaces the whole work, its photos included, at once.
    save: (values, etag) => saveWork.mutateAsync({ etag, values }),
    toValues: toWorkFormValues,
    toastId: saveWorkToastId,
  });

  return (
    <LanguageForm resource={`gallery-work-${work.data.id}`} fields={languageFields}>
      {/* The fields read the form from the context. */}
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <WorkFields
            isSaving={editForm.isSaving}
            savedPhoto={saved.data.photo}
            savedProcessPhotos={saved.data.processPhotos}
            references={references}
          />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
