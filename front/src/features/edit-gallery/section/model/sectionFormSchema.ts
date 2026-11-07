import { z } from "zod";

import { type GallerySection, maxSubsections } from "@/entities/gallery";

import { refineUniqueTitles, titleSchema } from "../../model/titles";

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
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

/** The values of a new section: no title, no subsections. */
export const emptySectionFormValues: SectionFormValues = {
  subsections: [],
  title: "",
};

/** The values of a section as stored on the server. */
export function toSectionFormValues({ subsections, title }: GallerySection): SectionFormValues {
  return { subsections: subsections.map(({ id, title }) => ({ id, title })), title };
}

/** A new row of the subsection list. */
export function newSubsection(): SectionFormValues["subsections"][number] {
  return { id: crypto.randomUUID(), title: "" };
}
