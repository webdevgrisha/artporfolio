import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

import type { Translations } from "@/shared/api/translations";
import { languageNames, type TargetLanguage, targetLanguages } from "@/shared/config/languages";
import { Select } from "@/shared/ui/select";

import type { WorkFormValues } from "../model/workFormSchema";
import styles from "./WorkLanguages.module.css";
import { WorkTranslationFields } from "./WorkTranslationFields";

type WorkLanguage = "ru" | TargetLanguage;

const russianName = "Русский (оригинал)";

interface WorkLanguagesProps {
  /** The fields of the work in Russian. */
  children: React.ReactNode;
  isSaving: boolean;
  /** The translations of the saved work. */
  saved: Translations;
}

/**
 * Switches a work form between its languages. All the languages are one form with one save: the
 * Russian fields stay mounted while hidden, so switching never loses what was typed.
 */
export function WorkLanguages({ children, isSaving, saved }: WorkLanguagesProps) {
  const [language, setLanguage] = React.useState<WorkLanguage>("ru");
  const { control } = useFormContext<WorkFormValues>();
  const { errors } = useFormState({ control });
  const { translations: translationErrors, ...russianErrors } = errors;
  const languagesWithErrors = [
    ...(Object.keys(russianErrors).length > 0 ? [russianName] : []),
    ...targetLanguages
      .filter((target) => translationErrors?.[target] !== undefined)
      .map((target) => languageNames[target]),
  ];
  const options = [
    { label: russianName, value: "ru" },
    ...targetLanguages.map((target) => ({ label: languageNames[target], value: target })),
  ];

  return (
    <div className={styles.root}>
      <Select
        className={styles.language}
        label="Язык"
        disabled={isSaving}
        error={
          languagesWithErrors.length > 0
            ? `Есть ошибки: ${languagesWithErrors.join(", ")}`
            : undefined
        }
        options={options}
        value={language}
        onChange={(value) => setLanguage(value as WorkLanguage)}
      />
      <div hidden={language !== "ru"}>{children}</div>
      {language !== "ru" && (
        <WorkTranslationFields isSaving={isSaving} language={language} saved={saved} />
      )}
    </div>
  );
}
