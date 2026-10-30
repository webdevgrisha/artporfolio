import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type ProcessPhoto, processPhotosQuery } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import { toProcessPhotoRows } from "../model/processPhotoRows";
import {
  type ProcessPhotosFormValues,
  processPhotosFormSchema,
} from "../model/processPhotosFormSchema";
import { saveProcessPhotosFeedback, useSaveProcessPhotos } from "../model/useSaveProcessPhotos";
import { ProcessPhotoFields } from "./ProcessPhotoFields";

interface EditProcessPhotosFormProps {
  className?: string;
  /** The process photos as stored on the server when the form opens, with the ETag of the list. */
  list: Tagged<ProcessPhoto[]>;
}

function toFormValues(photos: ProcessPhoto[]): ProcessPhotosFormValues {
  return { processPhotos: toProcessPhotoRows(photos) };
}

export function EditProcessPhotosForm({ className, list }: EditProcessPhotosFormProps) {
  const form = useForm<ProcessPhotosFormValues>({
    defaultValues: toFormValues(list.data),
    resolver: zodResolver(processPhotosFormSchema),
  });
  const saveProcessPhotos = useSaveProcessPhotos();
  const { editForm, saved } = useSavedForm({
    form,
    initial: list,
    query: processPhotosQuery,
    save: (values, etag) => saveProcessPhotos.mutateAsync({ etag, rows: values.processPhotos }),
    toValues: toFormValues,
    toastId: saveProcessPhotosFeedback.toastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <ProcessPhotoFields isSaving={editForm.isSaving} savedPhotos={saved.data} />
      </EditForm>
    </FormProvider>
  );
}
