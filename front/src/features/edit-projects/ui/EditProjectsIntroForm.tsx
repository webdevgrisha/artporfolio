import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type ProjectsIntro, projectsIntroQuery } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import { toTranslationsBody } from "@/shared/lib/translationsForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { LanguageForm } from "@/shared/ui/language-form";
import { Textarea } from "@/shared/ui/textarea";

import {
  introLanguageFields,
  maxIntroLength,
  type ProjectsIntroFormValues,
  projectsIntroFormSchema,
  toProjectsIntroFormValues,
} from "../model/projectsIntroFormSchema";
import { saveProjectsIntroFeedback, useSaveProjectsIntro } from "../model/useSaveProjectsIntro";
import styles from "./EditProjectsIntroForm.module.css";

interface EditProjectsIntroFormProps {
  className?: string;
  /** The text as stored on the server when the form opens, with its ETag. */
  intro: Tagged<ProjectsIntro>;
}

/** The text above the list of projects on the site. */
export function EditProjectsIntroForm({ className, intro }: EditProjectsIntroFormProps) {
  const form = useForm<ProjectsIntroFormValues>({
    defaultValues: toProjectsIntroFormValues(intro.data),
    resolver: zodResolver(projectsIntroFormSchema),
  });
  const saveIntro = useSaveProjectsIntro();
  const { editForm, saved } = useSavedForm({
    form,
    initial: intro,
    query: projectsIntroQuery,
    save: ({ text, translations }, etag) =>
      saveIntro.mutateAsync({
        etag,
        intro: { text, translations: toTranslationsBody(translations) },
      }),
    toValues: toProjectsIntroFormValues,
    toastId: saveProjectsIntroFeedback.toastId,
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
            hint={`До ${String(maxIntroLength)} символов. Абзацы разделяйте пустой строкой`}
            placeholder="Например: о каких проектах эта страница"
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
