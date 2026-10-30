import type { Photo } from "@/shared/api/photo";
import { EditPhotoForm } from "@/shared/ui/edit-photo-form";

import { saveAboutPhotoFeedback, useSaveAboutPhoto } from "../model/useSaveAboutPhoto";

interface EditAboutPhotoFormProps {
  className?: string;
  /** «Моё фото» as stored on the server. */
  photo: Photo | null;
}

export function EditAboutPhotoForm({ className, photo }: EditAboutPhotoFormProps) {
  const savePhoto = useSaveAboutPhoto();

  return (
    <EditPhotoForm
      className={className}
      label="Моё фото"
      photo={photo}
      toastId={saveAboutPhotoFeedback.toastId}
      onSave={savePhoto.mutateAsync}
    />
  );
}
