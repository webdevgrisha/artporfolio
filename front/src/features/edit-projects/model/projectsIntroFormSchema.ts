import { z } from "zod";

import type { ProjectsIntro } from "@/entities/project";
import { toTranslationValues, translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";

// Mirrors the server rule in backend/src/modules/projects/intro/schema.ts.
export const maxIntroLength = 1_000;

export const projectsIntroFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Введите текст")
    .max(maxIntroLength, `Не длиннее ${String(maxIntroLength)} символов`),
  /** The text in the other languages; an empty one is translated anew on save. */
  translations: translationValuesSchema({ text: maxIntroLength }),
});

/** How the form shows the translated text. */
export const introLanguageFields: readonly TranslatedField[] = [
  { field: "text", label: "Основной текст", multiline: true, source: "text" },
];

export type ProjectsIntroFormValues = z.infer<typeof projectsIntroFormSchema>;

/** The values of the text as stored on the server. */
export function toProjectsIntroFormValues({
  text,
  translations,
}: ProjectsIntro): ProjectsIntroFormValues {
  return { text, translations: toTranslationValues(translations, ["text"]) };
}
