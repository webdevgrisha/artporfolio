import { z } from "zod";

import { type GallerySection, maxSubsections } from "@/entities/gallery";

import { toTranslationValues, translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";

import { maxTitleLength, refineUniqueTitles, titleSchema } from "../../model/titles";

export const sectionFormSchema = z.object({
  title: titleSchema,
  subsections: z
    .array(
      z.object({
        /** Picked by the form for a new subsection, so works can refer to it once it is saved. */
        id: z.string(),
        title: titleSchema,
      }),
    )
    .max(maxSubsections, `Не больше ${String(maxSubsections)} подразделов`)
    .superRefine(refineUniqueTitles("Такой подраздел уже есть")),
  /** The title, and each subsection by its id, in the other languages. */
  translations: translationValuesSchema({ title: maxTitleLength }, maxTitleLength),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

/** The values of a new section: no title, no subsections. */
export const emptySectionFormValues: SectionFormValues = {
  subsections: [],
  title: "",
  translations: toTranslationValues({}, ["title"]),
};

/** The values of a section as stored on the server. */
export function toSectionFormValues({
  subsections,
  title,
  translations,
}: GallerySection): SectionFormValues {
  return {
    subsections: subsections.map(({ id, title }) => ({ id, title })),
    title,
    translations: toTranslationValues(translations, ["title", ...subsections.map(({ id }) => id)]),
  };
}

/** How the form shows the translated titles, for the subsections it holds now. */
export function toSectionLanguageFields(
  subsections: SectionFormValues["subsections"],
): TranslatedField[] {
  return [
    { field: "title", label: "Название", source: "title" },
    ...subsections.map(({ id, title }, index) => ({
      field: id,
      label: title || "Подраздел",
      source: `subsections.${String(index)}.title`,
    })),
  ];
}

/** A new row of the subsection list. */
export function newSubsection(): SectionFormValues["subsections"][number] {
  return { id: crypto.randomUUID(), title: "" };
}
