import { z } from "zod";

import { targetLanguages } from "#shared/i18n/languages";

/** The longest translation; no text of the site is longer than half of it. */
const maxTranslationLength = 4_000;

/** The path parameters of a request about the translations of one resource. */
export const resourceParamsSchema = z.object({
  resource: z.string().regex(/^[a-z0-9-]{1,100}$/),
});

/** The path parameters of a change in one language. */
export const languageParamsSchema = resourceParamsSchema.extend({
  language: z.enum(targetLanguages),
});

/**
 * What a person changed in one language, by key: a text is their edit, and null removes the text, so the translator makes it anew. A key left out stays as it is.
 */
export const translationPatchBodySchema = z.record(
  z.string(),
  z.string().trim().min(1).max(maxTranslationLength).nullable(),
);

export type ResourceParams = z.infer<typeof resourceParamsSchema>;
export type LanguageParams = z.infer<typeof languageParamsSchema>;
export type TranslationPatchBody = z.infer<typeof translationPatchBodySchema>;
