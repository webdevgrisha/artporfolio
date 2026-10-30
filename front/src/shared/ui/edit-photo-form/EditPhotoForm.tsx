import { zodResolver } from "@hookform/resolvers/zod";
import type { FetchQueryOptions } from "@tanstack/react-query";
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
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";

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
  /** Reads the photo afresh when a save finds that it has changed since. */
  query: FetchQueryOptions<Tagged<Photo | null>, Error, Tagged<Photo | null>, string[]>;
  /** The toast id of `onSave`, for the result of a save with nothing to send. */
  toastId: string;
}

/** Edits a single photo with its description, such as «Моё фото» or the contacts photo. */
export function EditPhotoForm({
  className,
  label,
  onSave,
  photo,
  query,
  toastId,
}: EditPhotoFormProps) {
  const form = useForm<PhotoFormValues>({
    defaultValues: toPhotoFormValues(photo.data),
    resolver: zodResolver(photoFormSchema),
  });
  const { dirtyFields } = form.formState;
  const { editForm, saved } = useSavedForm({
    form,
    initial: photo,
    query,
    save: (values, etag) => {
      const change = getPhotoChange(values, {
        isAltDirty: Boolean(dirtyFields.photoAlt),
        isPhotoDirty: Boolean(dirtyFields.photo),
      });

      return change ? onSave({ change, etag }) : null;
    },
    toValues: toPhotoFormValues,
    toastId,
  });

  return (
    // PhotoFields reads the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <PhotoFields label={label} isSaving={editForm.isSaving} serverPhoto={saved.data} />
      </EditForm>
    </FormProvider>
  );
}
