import { z } from "zod";

import type { GalleryIntro } from "@/entities/gallery";
import { toTranslationValues, translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";

// Mirrors the server rule in backend/src/modules/gallery/intro/schema.ts.
export const maxIntroLength = 1_000;

/** An empty text is not shown on the site. */
export const galleryIntroFormSchema = z.object({
  text: z
    .string()
    .trim()
    .max(maxIntroLength, `Не длиннее ${String(maxIntroLength)} символов`),
  /** The text in the other languages; an empty one is translated anew on save. */
  translations: translationValuesSchema({ text: maxIntroLength }),
});

/** How the form shows the translated text. */
export const introLanguageFields: readonly TranslatedField[] = [
  { field: "text", label: "Основной текст", multiline: true, source: "text" },
];

export type GalleryIntroFormValues = z.infer<typeof galleryIntroFormSchema>;

/** The values of the text as stored on the server. */
export function toGalleryIntroFormValues({
  text,
  translations,
}: GalleryIntro): GalleryIntroFormValues {
  return { text, translations: toTranslationValues(translations, ["text"]) };
}
