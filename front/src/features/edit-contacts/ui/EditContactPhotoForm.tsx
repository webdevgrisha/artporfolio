import type { Photo } from "@/shared/api/photo";
import { EditPhotoForm } from "@/shared/ui/edit-photo-form";

import { saveContactPhotoFeedback, useSaveContactPhoto } from "../model/useSaveContactPhoto";

interface EditContactPhotoFormProps {
  className?: string;
  /** The photo as stored on the server. */
  photo: Photo | null;
}

export function EditContactPhotoForm({ className, photo }: EditContactPhotoFormProps) {
  const savePhoto = useSaveContactPhoto();

  return (
    <EditPhotoForm
      className={className}
      label="Фото"
      photo={photo}
      toastId={saveContactPhotoFeedback.toastId}
      onSave={savePhoto.mutateAsync}
    />
  );
}
