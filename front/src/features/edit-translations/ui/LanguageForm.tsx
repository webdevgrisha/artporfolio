import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { type LanguageFormProps, translationsQuery } from "@/entities/translation";
import { languageNames, type TargetLanguage, targetLanguages } from "@/shared/config/languages";
import { Select } from "@/shared/ui/select";

import { getLanguageMark, getLanguageSummary } from "../lib/translationsForm";
import { type FormLanguage, useFormLanguage } from "../model/useFormLanguage";
import styles from "./LanguageForm.module.css";
import { TranslationForm } from "./TranslationForm";

/**
 * Switches an edit page between its languages. Every form opened stays mounted while hidden, so
 * switching never loses what was typed. Each language saves on its own: a translation is a resource
 * of its own, which the translator also changes in the background.
 */
export function LanguageForm({ children, fields, resource, savedTag }: LanguageFormProps) {
  const [language, setLanguage] = useFormLanguage();
  const queryClient = useQueryClient();
  const query = translationsQuery(resource);
  const { data } = useQuery(query);
  const [opened, setOpened] = React.useState<readonly TargetLanguage[]>([]);
  const keys = fields.map(({ key }) => key);

  if (language !== "ru" && !opened.includes(language)) {
    setOpened([...opened, language]);
  }

  const options = [
    { label: "Русский (оригинал)", value: "ru" },
    ...targetLanguages.map((target) => {
      const mark = data && getLanguageMark(data, target, keys);

      return {
        label: mark ? `${languageNames[target]} — ${mark}` : languageNames[target],
        value: target,
      };
    }),
  ];

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new tag is what asks for a new read.
  React.useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: translationsQuery(resource).queryKey });
  }, [queryClient, resource, savedTag]);

  const summary = data && language !== "ru" ? getLanguageSummary(data, language, keys) : null;

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <Select
          className={styles.language}
          label="Язык"
          options={options}
          value={language}
          onChange={(value) => setLanguage(value as FormLanguage)}
        />
        {/* Always there: a screen reader announces a change in a live region it already knows. */}
        <p className={styles.summary} aria-live="polite">
          {summary}
        </p>
      </div>
      <div hidden={language !== "ru"}>{children}</div>
      {opened.map((target) => (
        <div key={target} hidden={language !== target}>
          <TranslationForm fields={fields} language={target} resource={resource} />
        </div>
      ))}
    </div>
  );
}
