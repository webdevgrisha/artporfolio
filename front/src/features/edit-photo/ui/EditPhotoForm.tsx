import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { Tagged } from "@/shared/api/http";
import type { Photo } from "@/shared/api/photo";
import type { PhotoSlot } from "@/shared/api/photoSlot";
import {
  type PhotoFormValues,
  photoFieldsShape,
  refinePhoto,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";

import { getSavePhotoToastId, useSavePhoto } from "../model/useSavePhoto";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhoto);

interface EditPhotoFormProps {
  /** An example description, for the placeholder of the description field. */
  altPlaceholder: string;
  className?: string;
  label: string;
  /** The photo as stored on the server when the form opens, with its ETag. */
  photo: Tagged<Photo | null>;
  slot: PhotoSlot;
}

/** Edits a single photo with its description, such as «Моё фото» or the contacts photo. */
export function EditPhotoForm({
  altPlaceholder,
  className,
  label,
  photo,
  slot,
}: EditPhotoFormProps) {
  const savePhoto = useSavePhoto(slot);
  const form = useForm<PhotoFormValues>({
    defaultValues: toPhotoFormValues(photo.data),
    resolver: zodResolver(photoFormSchema),
  });
  const { editForm, saved } = useSavedForm({
    form,
    initial: photo,
    query: slot.query,
    save: (values, etag) => savePhoto.mutateAsync({ etag, values }),
    toValues: toPhotoFormValues,
    toastId: getSavePhotoToastId(slot),
  });

  return (
    // PhotoFields reads the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <PhotoFields
          altPlaceholder={altPlaceholder}
          label={label}
          isSaving={editForm.isSaving}
          serverPhoto={saved.data}
        />
      </EditForm>
    </FormProvider>
  );
}
