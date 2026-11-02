import { z } from "zod";

import { type GallerySection, maxSubsections } from "@/entities/gallery";

// Mirrors the server rules in backend/src/modules/gallery-sections/schema.ts.
export const maxSectionTitleLength = 50;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(maxSectionTitleLength, `Не длиннее ${String(maxSectionTitleLength)} символов`);

/** The visitor reads "Графика" and "графика" as the same title. */
function titleKey(title: string): string {
  return title.trim().toLocaleLowerCase("ru");
}

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
    .superRefine((subsections, context) => {
      const seen = new Set<string>();

      subsections.forEach(({ title }, index) => {
        const key = titleKey(title);

        if (key && seen.has(key)) {
          context.addIssue({
            code: "custom",
            message: "Такой подраздел уже есть",
            path: [index, "title"],
          });
        }

        seen.add(key);
      });
    }),
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
