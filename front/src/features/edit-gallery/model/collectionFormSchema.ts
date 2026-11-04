import { z } from "zod";

import { type GalleryCollection, maxCollectionWorks } from "@/entities/gallery";
import { photoFieldsShape, refinePhoto, toPhotoFormValues } from "@/shared/lib/photoForm";

import { yearSchema } from "./yearField";

// Mirror the server rules in backend/src/modules/gallery-collections/schema.ts.
export const collectionMaxLengths = {
  description: 2_000,
  title: 100,
} as const;

/**
 * Checks the end year once it is typed: it is optional, as a collection of one year has none, and
 * comes after the start year once that one is valid too.
 */
function refineEndYear(
  { endYear, startYear }: { endYear: string; startYear: string },
  context: z.RefinementCtx,
): void {
  if (!endYear.trim()) return;

  const issues = yearSchema.safeParse(endYear).error?.issues ?? [];

  for (const issue of issues) {
    context.addIssue({ code: "custom", message: issue.message, path: ["endYear"] });
  }

  if (issues.length === 0 && yearSchema.safeParse(startYear).success) {
    if (Number(endYear) <= Number(startYear)) {
      context.addIssue({
        code: "custom",
        message: "Позже года начала. Для одного года оставьте поле пустым",
        path: ["endYear"],
      });
    }
  }
}

export const collectionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Введите название")
      .max(collectionMaxLengths.title, `Не длиннее ${String(collectionMaxLengths.title)} символов`),
    description: z
      .string()
      .trim()
      .min(1, "Введите описание")
      .max(
        collectionMaxLengths.description,
        `Не длиннее ${String(collectionMaxLengths.description)} символов`,
      ),
    startYear: yearSchema,
    /** Empty for a collection of one year. */
    endYear: z.string(),
    ...photoFieldsShape,
    /** The works, by id; the page shows them in the order of the site. */
    workIds: z
      .array(z.string())
      .max(maxCollectionWorks, `Не больше ${String(maxCollectionWorks)} работ`),
  })
  // A collection is shown by its cover, so it cannot be removed, only replaced.
  .superRefine(refinePhoto)
  .superRefine(refineEndYear);

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;

/** The values of a new collection: every field empty, no works. */
export const emptyCollectionFormValues: CollectionFormValues = {
  description: "",
  endYear: "",
  startYear: "",
  title: "",
  ...toPhotoFormValues(null),
  workIds: [],
};

/** The values of a collection as stored on the server. */
export function toCollectionFormValues({
  cover,
  description,
  endYear,
  startYear,
  title,
  workIds,
}: GalleryCollection): CollectionFormValues {
  return {
    description,
    endYear: endYear === null ? "" : String(endYear),
    startYear: String(startYear),
    title,
    ...toPhotoFormValues(cover),
    workIds,
  };
}
