import { z } from "zod";

import type { AboutText } from "@/entities/about";
import { toTranslationValues, translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";

// Mirror the server rules in backend/src/modules/about/text/schema.ts.
export const aboutTextMaxLengths: Readonly<Record<"about" | "biography" | "creation", number>> = {
  about: 500,
  biography: 2_000,
  creation: 2_000,
};

function aboutText(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, "Введите текст")
    .max(maxLength, `Не длиннее ${String(maxLength)} символов`);
}

export const aboutTextFormSchema = z.object({
  about: aboutText(aboutTextMaxLengths.about),
  biography: aboutText(aboutTextMaxLengths.biography),
  creation: aboutText(aboutTextMaxLengths.creation),
  /** The texts in the other languages; an empty one is translated anew on save. */
  translations: translationValuesSchema(aboutTextMaxLengths),
});

export type AboutTextFormValues = z.infer<typeof aboutTextFormSchema>;

/** How the form shows the translated texts. */
export const aboutLanguageFields: readonly TranslatedField[] = [
  { field: "about", label: "О себе", multiline: true, source: "about" },
  { field: "biography", label: "Биография", multiline: true, source: "biography" },
  { field: "creation", label: "Творчество", multiline: true, source: "creation" },
];

/** The values of the texts as stored on the server. */
export function toAboutTextFormValues({
  about,
  biography,
  creation,
  translations,
}: AboutText): AboutTextFormValues {
  return {
    about,
    biography,
    creation,
    translations: toTranslationValues(translations, ["about", "biography", "creation"]),
  };
}
