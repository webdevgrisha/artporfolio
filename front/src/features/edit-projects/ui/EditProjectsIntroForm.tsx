import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type ProjectsIntro, projectsIntroQuery } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { Textarea } from "@/shared/ui/textarea";

import {
  maxIntroLength,
  type ProjectsIntroFormValues,
  projectsIntroFormSchema,
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
    defaultValues: intro.data,
    resolver: zodResolver(projectsIntroFormSchema),
  });
  const saveIntro = useSaveProjectsIntro();
  const { editForm } = useSavedForm({
    form,
    initial: intro,
    query: projectsIntroQuery,
    save: (values, etag) => saveIntro.mutateAsync({ etag, intro: values }),
    toValues: (data) => data,
    toastId: saveProjectsIntroFeedback.toastId,
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
        placeholder="Например: о каких проектах эта страница"
        rows={12}
        disabled={editForm.isSaving}
        error={errors.text?.message}
        isModified={Boolean(dirtyFields.text)}
        {...register("text")}
      />
    </EditForm>
  );
}
