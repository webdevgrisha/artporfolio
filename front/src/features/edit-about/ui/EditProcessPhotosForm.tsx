import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { ProcessPhoto } from "@/entities/about";
import { EditForm } from "@/shared/ui/edit-form";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import { toProcessPhotoRow, toProcessPhotoRows } from "../model/processPhotoRows";
import { getProcessPhotosChanges } from "../model/processPhotosChanges";
import {
  type ProcessPhotosFormValues,
  processPhotosFormSchema,
} from "../model/processPhotosFormSchema";
import { saveProcessPhotosFeedback, useSaveProcessPhotos } from "../model/useSaveProcessPhotos";
import { ProcessPhotoFields } from "./ProcessPhotoFields";

interface EditProcessPhotosFormProps {
  className?: string;
  /** The process photos as last loaded from the server. */
  processPhotos: readonly ProcessPhoto[];
}

export function EditProcessPhotosForm({ className, processPhotos }: EditProcessPhotosFormProps) {
  const form = useForm<ProcessPhotosFormValues>({
    defaultValues: { processPhotos: toProcessPhotoRows(processPhotos) },
    resolver: zodResolver(processPhotosFormSchema),
  });
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = form;
  const rows = useWatch({ control, name: "processPhotos" });
  // The photos this form has shown or saved. Another one, such as a photo added in another tab,
  // is not in the rows and must not count as deleted.
  const [knownIds, setKnownIds] = React.useState(
    () => new Set(processPhotos.map((photo) => photo.id)),
  );
  // Follows the reloads of the page data: a request that failed may still have changed the server.
  const savedPhotos = processPhotos.filter((photo) => knownIds.has(photo.id));
  const changes = getProcessPhotosChanges(rows, savedPhotos);
  const saveProcessPhotos = useSaveProcessPhotos();

  function markRowSaved(index: number, photo: ProcessPhoto) {
    setValue(`processPhotos.${index}`, toProcessPhotoRow(photo));
    setKnownIds((ids) => new Set(ids).add(photo.id));
  }

  async function saveChanges(values: ProcessPhotosFormValues) {
    const valuesChanges = getProcessPhotosChanges(values.processPhotos, savedPhotos);

    if (!valuesChanges) {
      showSuccessToast(savedMessage, { id: saveProcessPhotosFeedback.toastId });
      return;
    }

    try {
      await saveProcessPhotos.mutateAsync({ changes: valuesChanges, onRowSaved: markRowSaved });
    } catch {
      // The mutation has shown the error. The rows saved before it are marked as saved; the
      // others keep their changes, so the save can be repeated.
    }
  }

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={changes !== undefined}
        isSaving={isSubmitting}
        onRevert={() => reset({ processPhotos: toProcessPhotoRows(savedPhotos) })}
        onSubmit={handleSubmit(saveChanges)}
      >
        <ProcessPhotoFields
          isListModified={Boolean(changes && (changes.deleted.length > 0 || changes.isReordered))}
          isSaving={isSubmitting}
        />
      </EditForm>
    </FormProvider>
  );
}
