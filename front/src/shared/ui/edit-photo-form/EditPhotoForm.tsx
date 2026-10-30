import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { getSavePhotoErrorMessage, type Photo } from "@/shared/api/photo";
import {
  getPhotoChange,
  type PhotoChange,
  type PhotoFormValues,
  photoFieldsShape,
  refinePhotoAlt,
  toPhotoFormValues,
  toSavedPhotoValues,
} from "@/shared/lib/photoForm";
import { EditForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { showSaveResultToast } from "@/shared/ui/toast";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhotoAlt);

interface EditPhotoFormProps {
  className?: string;
  label: string;
  /** Sends the change to the server; rejects when it was not saved. */
  onSave: (change: PhotoChange) => Promise<unknown>;
  /** The photo as stored on the server. */
  photo: Photo | null;
  /** Toasts with the same id replace each other: one per form. */
  toastId: string;
}

/** Edits a single photo with its description, such as «Моё фото» or the contacts photo. */
export function EditPhotoForm({ className, label, onSave, photo, toastId }: EditPhotoFormProps) {
  const form = useForm<PhotoFormValues>({
    defaultValues: toPhotoFormValues(photo),
    resolver: zodResolver(photoFormSchema),
  });
  const {
    formState: { dirtyFields, isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;

  async function saveChanges(values: PhotoFormValues) {
    const change = getPhotoChange(values, {
      isAltDirty: Boolean(dirtyFields.photoAlt),
      isPhotoDirty: Boolean(dirtyFields.photo),
    });

    try {
      if (change) await onSave(change);
    } catch (error) {
      // The changes stay, so the save can be repeated.
      showSaveResultToast(getSavePhotoErrorMessage(error), { id: toastId });
      return;
    }

    reset(toSavedPhotoValues(values));
    showSaveResultToast(undefined, { id: toastId });
  }

  return (
    // PhotoFields reads the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
        onSubmit={handleSubmit(saveChanges)}
      >
        <PhotoFields label={label} isSaving={isSubmitting} serverPhoto={photo} />
      </EditForm>
    </FormProvider>
  );
}
