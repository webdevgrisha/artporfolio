import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type GalleryIntro, galleryIntroQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { toTranslationsBody } from "@/shared/lib/translationsForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { LanguageForm } from "@/shared/ui/language-form";
import { Textarea } from "@/shared/ui/textarea";

import {
  type GalleryIntroFormValues,
  galleryIntroFormSchema,
  introLanguageFields,
  maxIntroLength,
  toGalleryIntroFormValues,
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
    defaultValues: toGalleryIntroFormValues(intro.data),
    resolver: zodResolver(galleryIntroFormSchema),
  });
  const saveIntro = useSaveGalleryIntro();
  const { editForm, saved } = useSavedForm({
    form,
    initial: intro,
    query: galleryIntroQuery,
    save: ({ text, translations }, etag) =>
      saveIntro.mutateAsync({
        etag,
        intro: { text, translations: toTranslationsBody(translations) },
      }),
    toValues: toGalleryIntroFormValues,
    toastId: saveGalleryIntroFeedback.toastId,
  });
  const {
    formState: { dirtyFields, errors },
    register,
  } = form;

  return (
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <LanguageForm
          fields={introLanguageFields}
          isSaving={editForm.isSaving}
          saved={saved.data.translations}
        >
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
        </LanguageForm>
      </EditForm>
    </FormProvider>
  );
}
