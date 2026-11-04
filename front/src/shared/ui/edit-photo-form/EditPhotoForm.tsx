import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { Tagged } from "@/shared/api/http";
import { getSavePhotoErrorMessage, type Photo } from "@/shared/api/photo";
import { type PhotoSlot, saveSlotPhoto } from "@/shared/api/photoSlot";
import { useReplaceResource } from "@/shared/api/useReplaceResource";
import {
  getPhotoChange,
  type PhotoFormValues,
  photoFieldsShape,
  refinePhoto,
  type SavePhotoParams,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhoto);

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
    mutationFn: (params: SavePhotoParams) => saveSlotPhoto(slot, params),
    queryKey: slot.query.queryKey,
  });
  const form = useForm<PhotoFormValues>({
    defaultValues: toPhotoFormValues(photo.data),
    resolver: zodResolver(photoFormSchema),
  });
  const { dirtyFields } = form.formState;
  const { editForm, saved } = useSavedForm({
    form,
    initial: photo,
    query: slot.query,
    save: (values, etag) => {
      const change = getPhotoChange(values, { isAltDirty: Boolean(dirtyFields.photoAlt) });

      return change ? savePhoto.mutateAsync({ change, etag }) : null;
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
