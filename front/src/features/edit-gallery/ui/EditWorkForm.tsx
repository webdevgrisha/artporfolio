import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type GalleryWork, galleryWorkQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { toWorkFormValues, type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { saveWorkToastId, useSaveWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";

interface EditWorkFormProps {
  className?: string;
  /** The work as stored on the server when the form opens, with its ETag. */
  work: Tagged<GalleryWork>;
}

export function EditWorkForm({ className, work }: EditWorkFormProps) {
  const form = useForm<WorkFormValues>({
    defaultValues: toWorkFormValues(work.data),
    resolver: zodResolver(workFormSchema),
  });
  const saveWork = useSaveWork(work.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: work,
    query: galleryWorkQuery(work.data.id),
    // The server replaces the whole work, its photo included, at once.
    save: (values, etag) => saveWork.mutateAsync({ etag, values }),
    toValues: toWorkFormValues,
    toastId: saveWorkToastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <WorkFields isSaving={editForm.isSaving} savedPhoto={saved.data.photo} />
      </EditForm>
    </FormProvider>
  );
}
