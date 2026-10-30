import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { Tagged } from "@/shared/api/http";
import type { Photo } from "@/shared/api/photo";
import {
  getPhotoChange,
  type PhotoFormValues,
  photoFieldsShape,
  refinePhotoAlt,
  type SavePhotoParams,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";
import { EditForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhotoAlt);

interface EditPhotoFormProps {
  className?: string;
  label: string;
  /**
   * Sends the change to the server and shows its result; resolves with the photo now saved and its
   * ETag, and rejects when it was not saved.
   */
  onSave: (params: SavePhotoParams) => Promise<Tagged<Photo | null>>;
  /** The photo as stored on the server when the form opens, with its ETag. */
  photo: Tagged<Photo | null>;
  /** The toast id of `onSave`, for the result of a save with nothing to send. */
  toastId: string;
}

/** Edits a single photo with its description, such as «Моё фото» or the contacts photo. */
export function EditPhotoForm({ className, label, onSave, photo, toastId }: EditPhotoFormProps) {
  // The photo the fields were made from. Its ETag goes with the save, so a photo changed since,
  // for example in another tab, is not overwritten.
  const [savedPhoto, setSavedPhoto] = React.useState(photo);
  const form = useForm<PhotoFormValues>({
    defaultValues: toPhotoFormValues(photo.data),
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

    let saved: Tagged<Photo | null>;

    try {
      saved = await onSave({ change, etag: savedPhoto.etag });
    } catch {
      // `onSave` has shown the error; the changes stay, so the save can be repeated.
      return;
    }

    setSavedPhoto(saved);
    reset(toPhotoFormValues(saved.data));
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
        <PhotoFields label={label} isSaving={isSubmitting} serverPhoto={savedPhoto.data} />
      </EditForm>
    </FormProvider>
  );
}
