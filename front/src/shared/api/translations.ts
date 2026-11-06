import { z } from "zod";

/** Who wrote a translation, and whether the Russian text changed since. */
export const translationStatuses = ["auto", "edited", "outdated"] as const;

export type TranslationStatus = (typeof translationStatuses)[number];

const translationSchema = z.object({
  status: z.enum(translationStatuses),
  text: z.string(),
});

/** The translations of a resource by language and then by field; a missing text is left out. */
export const translationsSchema = z.record(z.string(), z.record(z.string(), translationSchema));

export type Translations = z.infer<typeof translationsSchema>;

/** What a form sends for each language and field: a text, or null to translate it anew. */
export type TranslationsBody = Record<string, Record<string, string | null>>;
