import type { ZodType } from "zod";

/** The messages of every field the schema rejects, by path, e.g. `processPhotos.0.alt`. */
export function fieldErrors(schema: ZodType, value: unknown): Record<string, string[]> {
  const byField: Record<string, string[]> = {};

  for (const issue of schema.safeParse(value).error?.issues ?? []) {
    const field = issue.path.join(".");
    byField[field] = [...(byField[field] ?? []), issue.message];
  }

  return byField;
}
