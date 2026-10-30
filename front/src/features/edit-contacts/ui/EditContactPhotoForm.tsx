import { contactPhoto } from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
import type { Photo } from "@/shared/api/photo";
import { EditPhotoForm } from "@/shared/ui/edit-photo-form";

interface EditContactPhotoFormProps {
  className?: string;
  /** The photo as stored on the server when the form opens, with its ETag. */
  photo: Tagged<Photo | null>;
}

export function EditContactPhotoForm({ className, photo }: EditContactPhotoFormProps) {
  return <EditPhotoForm className={className} label="Фото" photo={photo} slot={contactPhoto} />;
}
