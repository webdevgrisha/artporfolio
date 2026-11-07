import { z } from "zod";

/** Who wrote a translation, and whether it is about to change or fell behind the Russian text. */
const translationStatuses = ["auto", "edited", "outdated", "pending"] as const;

export type TranslationStatus = (typeof translationStatuses)[number];

const translationSchema = z.object({
  status: z.enum(translationStatuses),
  text: z.string(),
});

/** The translations of a resource, which the server keeps apart from the resource itself. */
export const resourceTranslationsSchema = z.object({
  /** The Russian texts as last saved, by key. */
  sources: z.record(z.string(), z.string()),
  /** By language and then by key; a text not translated yet is left out. */
  translations: z.record(z.string(), z.record(z.string(), translationSchema)),
  /** Whether the translator is still to make some of the texts. */
  isTranslating: z.boolean(),
  /** Whether the server gave up on some of the texts. */
  failed: z.boolean(),
});

export type ResourceTranslations = z.infer<typeof resourceTranslationsSchema>;

/** A person's text, with the Russian text they wrote it from. */
export interface TranslationEdit {
  source: string;
  text: string;
}
