import { aboutPhoto } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import type { Photo } from "@/shared/api/photo";
import { EditPhotoForm } from "@/shared/ui/edit-photo-form";

interface EditAboutPhotoFormProps {
  className?: string;
  /** The photo as stored on the server when the form opens, with its ETag. */
  photo: Tagged<Photo | null>;
}

export function EditAboutPhotoForm({ className, photo }: EditAboutPhotoFormProps) {
  return <EditPhotoForm className={className} label="Моё фото" photo={photo} slot={aboutPhoto} />;
}
