import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { Photo } from "@/shared/api/photo";
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
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhotoAlt);

interface EditPhotoFormProps {
  className?: string;
  label: string;
  /** Sends the change to the server and shows its result; rejects when it was not saved. */
  onSave: (change: PhotoChange) => Promise<unknown>;
  /** The photo as stored on the server. */
  photo: Photo | null;
  /** The toast id of `onSave`, for the result of a save with nothing to send. */
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

    if (!change) {
      showSuccessToast(savedMessage, { id: toastId });
      return;
    }

    try {
      await onSave(change);
    } catch {
      // `onSave` has shown the error; the changes stay, so the save can be repeated.
      return;
    }

    reset(toSavedPhotoValues(values));
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
