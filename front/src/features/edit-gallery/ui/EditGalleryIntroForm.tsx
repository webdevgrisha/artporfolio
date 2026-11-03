import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type GalleryIntro, galleryIntroQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { Textarea } from "@/shared/ui/textarea";

import {
  type GalleryIntroFormValues,
  galleryIntroFormSchema,
  maxIntroLength,
} from "../model/galleryIntroFormSchema";
import { saveGalleryIntroFeedback, useSaveGalleryIntro } from "../model/useSaveGalleryIntro";
import styles from "./EditGalleryIntroForm.module.css";

interface EditGalleryIntroFormProps {
  className?: string;
  /** The text as stored on the server when the form opens, with its ETag. */
  intro: Tagged<GalleryIntro>;
}

/** The text above the works in the gallery on the site. */
export function EditGalleryIntroForm({ className, intro }: EditGalleryIntroFormProps) {
  const form = useForm<GalleryIntroFormValues>({
    defaultValues: intro.data,
    resolver: zodResolver(galleryIntroFormSchema),
  });
  const saveIntro = useSaveGalleryIntro();
  const { editForm } = useSavedForm({
    form,
    initial: intro,
    query: galleryIntroQuery,
    save: (values, etag) => saveIntro.mutateAsync({ etag, intro: values }),
    toValues: (data) => data,
    toastId: saveGalleryIntroFeedback.toastId,
  });
  const {
    formState: { dirtyFields, errors },
    register,
  } = form;

  return (
    <EditForm className={className} {...editForm}>
      <Textarea
        className={styles.text}
        label="Основной текст"
        hint={`Необязательно. До ${String(maxIntroLength)} символов. Абзацы разделяйте пустой строкой`}
        placeholder="Например: какие работы собраны в галерее"
        rows={12}
        disabled={editForm.isSaving}
        error={errors.text?.message}
        isModified={Boolean(dirtyFields.text)}
        {...register("text")}
      />
    </EditForm>
  );
}
