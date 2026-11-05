import clsx from "clsx";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxProjectPhotos } from "@/entities/project";
import type { ListPhoto } from "@/shared/api/photo";
import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { Textarea } from "@/shared/ui/textarea";

import { type ProjectFormValues, projectMaxLengths } from "../model/projectFormSchema";
import styles from "./ProjectFields.module.css";

interface ProjectFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photos of the saved project, to show that some were removed or moved; none for a new one. */
  savedPhotos: readonly ListPhoto[];
}

/** The fields of a project form; they read the form from its context. */
export function ProjectFields({ className, isSaving, savedPhotos }: ProjectFieldsProps) {
  const { control, register } = useFormContext<ProjectFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<ProjectFormValues>();
  const [title, link] = useWatch({ control, name: ["title", "link"] });

  return (
    <div className={clsx(styles.root, className)}>
      <PhotoListField
        label="Фото проекта"
        altPlaceholder="Например: разворот книги с иллюстрацией"
        maxPhotos={maxProjectPhotos}
        isSaving={isSaving}
        savedPhotos={savedPhotos}
      />

      <div className={styles.texts}>
        <ClearableInput
          label="Название"
          hint={`До ${String(projectMaxLengths.title)} символов`}
          placeholder="Например: Слон"
          disabled={isSaving}
          error={errors.title?.message}
          isModified={Boolean(dirtyFields.title)}
          hasValue={Boolean(title)}
          clearLabel="Очистить название"
          onClear={() => clearField("title")}
          {...register("title")}
        />
        <Textarea
          label="Описание"
          hint={`До ${String(projectMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём проект и как он сделан"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...register("description")}
        />
        <ClearableInput
          label="Ссылка"
          type="url"
          hint="Необязательно"
          placeholder="https://…"
          spellCheck={false}
          disabled={isSaving}
          error={errors.link?.message}
          isModified={Boolean(dirtyFields.link)}
          hasValue={Boolean(link)}
          clearLabel="Очистить ссылку"
          onClear={() => clearField("link")}
          {...register("link")}
        />
      </div>
    </div>
  );
}
