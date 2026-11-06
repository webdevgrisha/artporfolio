import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Translations } from "@/shared/api/translations";
import { rightToLeftLanguages, type TargetLanguage } from "@/shared/config/languages";
import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ClearableTextarea } from "@/shared/ui/clearable-textarea";

import type { WorkFormValues } from "../model/workFormSchema";
import {
  getTranslationHint,
  type WorkTranslatedField,
  workTranslatedFields,
} from "../model/workTranslation";
import styles from "./WorkLanguages.module.css";

const fieldLabels: Record<WorkTranslatedField, string> = {
  alt: "Описание фото",
  city: "Город",
  description: "Описание",
  title: "Название",
};

interface WorkTranslationFieldsProps {
  isSaving: boolean;
  language: TargetLanguage;
  /** The translations of the saved work. */
  saved: Translations;
}

/** The texts of a work in one language, each with the Russian text it translates. */
export function WorkTranslationFields({ isSaving, language, saved }: WorkTranslationFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<WorkFormValues>();
  const texts = useWatch({ control, name: `translations.${language}` });
  const [title, description, city, alt] = useWatch({
    control,
    name: ["title", "description", "city", "photoAlt"],
  });
  const originals: Record<WorkTranslatedField, string> = { alt, city, description, title };

  return (
    <div
      className={styles.fields}
      dir={rightToLeftLanguages.includes(language) ? "rtl" : undefined}
    >
      {workTranslatedFields.map((field) => {
        const Control = field === "description" ? ClearableTextarea : ClearableInput;

        return (
          <Control
            key={field}
            label={fieldLabels[field]}
            hint={getTranslationHint({
              original: originals[field].trim(),
              status: saved[language]?.[field]?.status,
              text: texts[field].trim(),
            })}
            disabled={isSaving || originals[field].trim() === ""}
            error={errors.translations?.[language]?.[field]?.message}
            isModified={Boolean(dirtyFields.translations?.[language]?.[field])}
            hasValue={Boolean(texts[field])}
            clearLabel="Очистить, чтобы перевести заново"
            onClear={() => clearField(`translations.${language}.${field}`)}
            {...(field === "description" ? { rows: 8 } : {})}
            {...register(`translations.${language}.${field}`)}
          />
        );
      })}
    </div>
  );
}
