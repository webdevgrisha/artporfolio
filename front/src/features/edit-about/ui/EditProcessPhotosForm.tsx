import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { maxProcessPhotos, processPhotosQuery } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import type { ListPhoto } from "@/shared/api/photo";
import { toPhotoListRows } from "@/shared/lib/photoListForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { PhotoListField } from "@/shared/ui/photo-list-field";

import {
  type ProcessPhotosFormValues,
  processPhotosFormSchema,
} from "../model/processPhotosFormSchema";
import { saveProcessPhotosFeedback, useSaveProcessPhotos } from "../model/useSaveProcessPhotos";

interface EditProcessPhotosFormProps {
  className?: string;
  /** The process photos as stored on the server when the form opens, with the ETag of the list. */
  list: Tagged<ListPhoto[]>;
}

function toFormValues(photos: ListPhoto[]): ProcessPhotosFormValues {
  return { photos: toPhotoListRows(photos) };
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
    save: (values, etag) => saveProcessPhotos.mutateAsync({ etag, rows: values.photos }),
    toValues: toFormValues,
    toastId: saveProcessPhotosFeedback.toastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <PhotoListField
          label="Фото процесса"
          altPlaceholder="Например: эскиз углём на холсте"
          maxPhotos={maxProcessPhotos}
          isSaving={editForm.isSaving}
          savedPhotos={saved.data}
        />
      </EditForm>
    </FormProvider>
  );
}
