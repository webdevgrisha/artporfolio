import { z } from "zod";

import { languages, sourceLanguage } from "#shared/i18n/languages";

/**
 * The query of a read the site makes: `lang` names the language of the texts, which come in the
 * source language without it.
 */
export const languageQuerySchema = z.object({
  lang: z.enum(languages).default(sourceLanguage),
});

export type LanguageQuery = z.infer<typeof languageQuerySchema>;
