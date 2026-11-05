import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { Tagged } from "@/shared/api/http";
import { getSavePhotoErrorMessage, type Photo } from "@/shared/api/photo";
import { type PhotoSlot, saveSlotPhoto } from "@/shared/api/photoSlot";
import { useReplaceResource } from "@/shared/api/useReplaceResource";
import {
  type PhotoFormValues,
  photoFieldsShape,
  refinePhoto,
  toPhotoBody,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhoto);

interface SavePhotoParams {
  /** The ETag of the photo the values were made from. */
  etag: string;
  values: PhotoFormValues;
}

interface EditPhotoFormProps {
  className?: string;
  label: string;
  /** The photo as stored on the server when the form opens, with its ETag. */
  photo: Tagged<Photo | null>;
  slot: PhotoSlot;
}

/** Edits a single photo with its description, such as «Моё фото» or the contacts photo. */
export function EditPhotoForm({ className, label, photo, slot }: EditPhotoFormProps) {
  // One toast for the saves of this photo: a later result replaces the previous one.
  const toastId = `save ${slot.path}`;
  // The server returns the saved photo with its ETag, so the page need not load it again.
  const savePhoto = useReplaceResource({
    feedback: { getErrorMessage: getSavePhotoErrorMessage, toastId },
    mutationFn: async ({ etag, values }: SavePhotoParams) =>
      saveSlotPhoto(slot, { body: await toPhotoBody(values), etag }),
    queryKey: slot.query.queryKey,
  });
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
