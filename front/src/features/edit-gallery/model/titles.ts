import { type RefinementCtx, z } from "zod";

// Mirrors the server rules for the titles of the sections, the subsections, the materials, the
// colors and the palettes (their schema.ts in backend/src/modules/gallery).
export const maxTitleLength = 50;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(maxTitleLength, `Не длиннее ${String(maxTitleLength)} символов`);

/** The visitor reads "Акварель" and "акварель" as the same title. */
export function titleKey(title: string): string {
  return title.trim().toLocaleLowerCase("ru");
}

/**
 * Points at the title of every row that repeats the title of an earlier one, with `message`, so
 * the field of that row shows it.
 */
export function refineUniqueTitles(message: string) {
  return (rows: readonly { title: string }[], context: RefinementCtx) => {
    const seen = new Set<string>();

    rows.forEach(({ title }, index) => {
      const key = titleKey(title);

      if (key && seen.has(key)) {
        context.addIssue({ code: "custom", message, path: [index, "title"] });
      }

      seen.add(key);
    });
  };
}
