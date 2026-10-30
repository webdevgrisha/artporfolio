import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { ProcessPhoto } from "@/entities/about";
import { EditForm } from "@/shared/ui/edit-form";
import { showSaveResultToast } from "@/shared/ui/toast";

import { getSaveProcessPhotosErrorMessage } from "../lib/saveErrorMessages";
import { toProcessPhotoRows } from "../model/processPhotoRows";
import { getProcessPhotosChanges } from "../model/processPhotosChanges";
import {
  type ProcessPhotosFormValues,
  processPhotosFormSchema,
} from "../model/processPhotosFormSchema";
import type { SaveProcessPhotosResult } from "../model/saveProcessPhotos";
import { useSaveProcessPhotos } from "../model/useSaveProcessPhotos";
import { ProcessPhotoFields } from "./ProcessPhotoFields";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "process-photos-save";

interface EditProcessPhotosFormProps {
  className?: string;
  /** The process photos as stored on the server when the form opens. */
  processPhotos: readonly ProcessPhoto[];
}

export function EditProcessPhotosForm({ className, processPhotos }: EditProcessPhotosFormProps) {
  const form = useForm<ProcessPhotosFormValues>({
    defaultValues: { processPhotos: toProcessPhotoRows(processPhotos) },
    resolver: zodResolver(processPhotosFormSchema),
  });
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
    resetField,
    setValue,
  } = form;
  // The photos the rows were made from. The changes are found against them, not against the page
  // data: once reloaded, that may hold a photo added in another tab, which the rows do not show
  // and must not delete.
  const [savedPhotos, setSavedPhotos] = React.useState(processPhotos);
  const saveProcessPhotos = useSaveProcessPhotos();

  async function saveChanges(values: ProcessPhotosFormValues) {
    const changes = getProcessPhotosChanges(values.processPhotos, savedPhotos);

    if (!changes) {
      showSaveResultToast(undefined, { id: saveToastId });
      return;
    }

    let result: SaveProcessPhotosResult;

    try {
      result = await saveProcessPhotos.mutateAsync({ changes, savedProcessPhotos: savedPhotos });
    } catch (error) {
      showSaveResultToast(getSaveProcessPhotosErrorMessage(error), { id: saveToastId });
      return;
    }

    // The list on the server is the saved value now; rows whose change failed stay modified.
    setSavedPhotos(result.photos);
    resetField("processPhotos", { defaultValue: toProcessPhotoRows(result.photos) });
    setValue("processPhotos", result.rows, { shouldDirty: true });
    showSaveResultToast(result.error, { id: saveToastId });
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
        <ProcessPhotoFields isSaving={isSubmitting} serverPhotos={savedPhotos} />
      </EditForm>
    </FormProvider>
  );
}
