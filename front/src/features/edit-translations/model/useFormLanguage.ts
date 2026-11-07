import { useSearchParams } from "react-router";

import { type TargetLanguage, targetLanguages } from "@/shared/config/languages";

/** The language a form shows: Russian, its own, or one it is translated into. */
export type FormLanguage = "ru" | TargetLanguage;

const languageParam = "lang";

function isTargetLanguage(value: string | null): value is TargetLanguage {
  return targetLanguages.some((language) => language === value);
}

/**
 * The language of the form on the page, kept in the address: a reload keeps it, and a link opens
 * it. Changing it replaces the address, so Back leaves the page instead of undoing each choice.
 */
export function useFormLanguage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(languageParam);
  const language: FormLanguage = isTargetLanguage(value) ? value : "ru";

  function setLanguage(next: FormLanguage) {
    const params = new URLSearchParams(searchParams);

    if (next === "ru") {
      params.delete(languageParam);
    } else {
      params.set(languageParam, next);
    }

    setSearchParams(params, { replace: true });
  }

  return [language, setLanguage] as const;
}
