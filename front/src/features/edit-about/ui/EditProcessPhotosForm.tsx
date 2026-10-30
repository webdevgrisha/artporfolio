import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { ProcessPhoto } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { EditForm } from "@/shared/ui/edit-form";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import { toProcessPhotoRows } from "../model/processPhotoRows";
import {
  type ProcessPhotosFormValues,
  processPhotosFormSchema,
} from "../model/processPhotosFormSchema";
import { saveProcessPhotosFeedback, useSaveProcessPhotos } from "../model/useSaveProcessPhotos";
import { ProcessPhotoFields } from "./ProcessPhotoFields";

interface EditProcessPhotosFormProps {
  className?: string;
  /** The process photos as stored on the server when the form opens. */
  list: Tagged<ProcessPhoto[]>;
}

export function EditProcessPhotosForm({ className, list }: EditProcessPhotosFormProps) {
  // The list the rows were made from. Its ETag goes with the save, so a list changed since, for
  // example in another tab, is not overwritten.
  const [savedList, setSavedList] = React.useState(list);
  const form = useForm<ProcessPhotosFormValues>({
    defaultValues: { processPhotos: toProcessPhotoRows(list.data) },
    resolver: zodResolver(processPhotosFormSchema),
  });
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;
  const saveProcessPhotos = useSaveProcessPhotos();

  async function saveChanges(values: ProcessPhotosFormValues) {
    if (!isDirty) {
      showSuccessToast(savedMessage, { id: saveProcessPhotosFeedback.toastId });
      return;
    }

    let saved: Tagged<ProcessPhoto[]>;

    try {
      saved = await saveProcessPhotos.mutateAsync({
        etag: savedList.etag,
        rows: values.processPhotos,
      });
    } catch {
      // The mutation has shown the error; nothing was saved, so the changes stay.
      return;
    }

    setSavedList(saved);
    reset({ processPhotos: toProcessPhotoRows(saved.data) });
  }

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
        onSubmit={handleSubmit(saveChanges)}
      >
        <ProcessPhotoFields isSaving={isSubmitting} savedPhotos={savedList.data} />
      </EditForm>
    </FormProvider>
  );
}
