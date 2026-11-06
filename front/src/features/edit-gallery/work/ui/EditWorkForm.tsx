import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type GalleryWork, galleryWorkQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { type WorkReferences, workReferenceQueries } from "../model/useWorkReferences";
import { type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { toWorkFormValues } from "../model/workFormValues";
import { saveWorkToastId, useSaveWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";
import { WorkLanguages } from "./WorkLanguages";

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
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <WorkLanguages isSaving={editForm.isSaving} saved={saved.data.translations}>
          <WorkFields
            isSaving={editForm.isSaving}
            savedPhoto={saved.data.photo}
            savedProcessPhotos={saved.data.processPhotos}
            references={references}
          />
        </WorkLanguages>
      </EditForm>
    </FormProvider>
  );
}
