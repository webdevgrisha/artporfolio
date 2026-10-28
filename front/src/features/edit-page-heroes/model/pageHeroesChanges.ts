import { z } from "zod";

import { type SitePageId, sitePageIds } from "@/entities/site-page";

const heroChangeSchema = z.discriminatedUnion("type", [
  z.object({ file: z.instanceof(File), type: z.literal("upload") }),
  z.object({ type: z.literal("delete") }),
]);

const pageHeroesChangesSchema = z.partialRecord(z.enum(sitePageIds), heroChangeSchema);

export type HeroChange = z.infer<typeof heroChangeSchema>;

/** What a save sends to the server: only the pages whose hero was changed. */
export type PageHeroesChanges = z.infer<typeof pageHeroesChangesSchema>;

// The changes travel from the form to the route action as FormData, the only body that can
// carry a file. Each changed page has a field for the type of the change and one for the file.
function heroFieldNames(page: SitePageId) {
  return { file: `${page}File`, type: `${page}Type` };
}

export function pageHeroesChangesToFormData(changes: PageHeroesChanges): FormData {
  const formData = new FormData();

  for (const page of sitePageIds) {
    const change = changes[page];
    if (!change) continue;

    const names = heroFieldNames(page);
    formData.set(names.type, change.type);
    if (change.type === "upload") formData.set(names.file, change.file);
  }

  return formData;
}

/** Reads and validates the changes sent by `pageHeroesChangesToFormData`. */
export function parsePageHeroesChanges(formData: FormData) {
  const changedPages = sitePageIds.filter((page) => formData.has(heroFieldNames(page).type));

  // A missing file is `null` and fails the schema.
  return pageHeroesChangesSchema.safeParse(
    Object.fromEntries(
      changedPages.map((page) => {
        const names = heroFieldNames(page);
        return [page, { file: formData.get(names.file), type: formData.get(names.type) }];
      }),
    ),
  );
}
