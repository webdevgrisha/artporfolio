import React from "react";
import { type FieldValues, useFormContext, useFormState } from "react-hook-form";

import type { Translations } from "@/shared/api/translations";
import { languageNames, type TargetLanguage, targetLanguages } from "@/shared/config/languages";
import { countOutdated } from "@/shared/lib/translationsForm";
import { Select } from "@/shared/ui/select";

import styles from "./LanguageForm.module.css";
import { TranslationFields } from "./TranslationFields";

type FormLanguage = "ru" | TargetLanguage;

const russianName = "Русский (оригинал)";

/** A text of the form that the site shows in every language. */
export interface TranslatedField {
  /** The name the server gives the text in `translations`. */
  field: string;
  label: string;
  /** Whether the text takes several lines. */
  multiline?: boolean;
  /** The path of the form field that holds the text in Russian. */
  source: string;
}

interface LanguageFormProps {
  /** The fields of the form in Russian. */
  children: React.ReactNode;
  fields: readonly TranslatedField[];
  isSaving: boolean;
  /** The translations of the saved resource. */
  saved: Translations;
}

/**
 * Switches a form between its languages. It reads a form with a `translations` field from its
 * context. All the languages are one form with one save: the Russian fields stay mounted while
 * hidden, so switching never loses what was typed.
 */
export function LanguageForm({ children, fields, isSaving, saved }: LanguageFormProps) {
  const [language, setLanguage] = React.useState<FormLanguage>("ru");
  const { control } = useFormContext<FieldValues>();
  const { errors } = useFormState({ control });
  const { translations: translationErrors, ...russianErrors } = errors;
  const languagesWithErrors = [
    ...(Object.keys(russianErrors).length > 0 ? [russianName] : []),
    ...targetLanguages
      .filter((target) => (translationErrors as FieldValues | undefined)?.[target] !== undefined)
      .map((target) => languageNames[target]),
  ];
  const outdated = targetLanguages.map((target) => countOutdated(saved, target));
  const outdatedTotal = outdated.reduce((total, count) => total + count, 0);
  const options = [
    { label: russianName, value: "ru" },
    ...targetLanguages.map((target, index) => ({
      label: outdated[index] ? `${languageNames[target]} — устарело` : languageNames[target],
      value: target,
    })),
  ];

  return (
    <div className={styles.root}>
      <Select
        className={styles.language}
        label="Язык"
        hint={outdatedTotal > 0 ? `Устарело переводов: ${String(outdatedTotal)}` : undefined}
        disabled={isSaving}
        error={
          languagesWithErrors.length > 0
            ? `Есть ошибки: ${languagesWithErrors.join(", ")}`
            : undefined
        }
        options={options}
        value={language}
        onChange={(value) => setLanguage(value as FormLanguage)}
      />
      <div hidden={language !== "ru"}>{children}</div>
      {language !== "ru" && (
        <TranslationFields fields={fields} isSaving={isSaving} language={language} saved={saved} />
      )}
    </div>
  );
}
