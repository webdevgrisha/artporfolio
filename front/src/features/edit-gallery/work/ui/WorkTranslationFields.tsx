import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Translations } from "@/shared/api/translations";
import type { TargetLanguage } from "@/shared/config/languages";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

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
  const { control, register, setValue } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const texts = useWatch({ control, name: `translations.${language}` });
  const [title, description, city, alt] = useWatch({
    control,
    name: ["title", "description", "city", "photoAlt"],
  });
  const originals: Record<WorkTranslatedField, string> = { alt, city, description, title };

  function translateAnew() {
    for (const field of workTranslatedFields) {
      setValue(`translations.${language}.${field}`, "", { shouldDirty: true });
    }
  }

  return (
    <div className={styles.fields}>
      {workTranslatedFields.map((field) => {
        const Control = field === "description" ? Textarea : Input;

        return (
          <Control
            key={field}
            label={fieldLabels[field]}
            // Arabic is written from right to left.
            dir="auto"
            hint={getTranslationHint({
              original: originals[field].trim(),
              status: saved[language]?.[field]?.status,
              text: texts[field].trim(),
            })}
            disabled={isSaving || originals[field].trim() === ""}
            error={errors.translations?.[language]?.[field]?.message}
            isModified={Boolean(dirtyFields.translations?.[language]?.[field])}
            {...(field === "description" ? { rows: 8 } : {})}
            {...register(`translations.${language}.${field}`)}
          />
        );
      })}
      <Button className={styles.translateAnew} disabled={isSaving} onClick={translateAnew}>
        Перевести заново
      </Button>
    </div>
  );
}
