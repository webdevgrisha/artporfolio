import { type FieldValues, useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Translations } from "@/shared/api/translations";
import { rightToLeftLanguages, type TargetLanguage } from "@/shared/config/languages";
import { getTranslationHint } from "@/shared/lib/translationsForm";
import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ClearableTextarea } from "@/shared/ui/clearable-textarea";

import type { TranslatedField } from "./LanguageForm";
import styles from "./LanguageForm.module.css";

interface TranslationFieldsProps {
  fields: readonly TranslatedField[];
  isSaving: boolean;
  language: TargetLanguage;
  /** The translations of the saved resource. */
  saved: Translations;
}

/** The texts of a form in one language, each with the Russian text it translates. */
export function TranslationFields({ fields, isSaving, language, saved }: TranslationFieldsProps) {
  const { control, register } = useFormContext<FieldValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<FieldValues>();
  const values = useWatch({ control }) as FieldValues;
  const fieldErrors = (errors.translations as FieldValues | undefined)?.[language];
  const dirtyTexts = (dirtyFields.translations as FieldValues | undefined)?.[language];

  return (
    <div
      className={styles.fields}
      dir={rightToLeftLanguages.includes(language) ? "rtl" : undefined}
    >
      {fields.map(({ field, label, multiline = false, source }) => {
        const Control = multiline ? ClearableTextarea : ClearableInput;
        const name = `translations.${language}.${field}`;
        const original = String(values[source] ?? "").trim();
        const text = String(values.translations?.[language]?.[field] ?? "");

        return (
          <Control
            key={field}
            label={label}
            hint={getTranslationHint({
              original,
              status: saved[language]?.[field]?.status,
              text: text.trim(),
            })}
            disabled={isSaving || original === ""}
            error={fieldErrors?.[field]?.message}
            isModified={Boolean(dirtyTexts?.[field])}
            hasValue={Boolean(text)}
            clearLabel="Очистить, чтобы перевести заново"
            onClear={() => clearField(name)}
            {...(multiline ? { rows: 8 } : {})}
            {...register(name)}
          />
        );
      })}
    </div>
  );
}
