import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { SitePageId } from "@/entities/site-page";

import { heroFields } from "./heroFields";
import type { PageHeroesFormValues } from "./pageHeroesFormValues";

export type HeroChange = { file: File; type: "upload" } | { type: "delete" };

/** What a save sends to the server: only the pages whose hero was changed. */
export type PageHeroesChanges = Partial<Record<SitePageId, HeroChange>>;

/**
 * Picks the pages whose hero was changed in the form. A hero is deleted only when it was removed
 * here, never because the server has a hero the form did not show, such as one uploaded in
 * another tab.
 */
export function getPageHeroesChanges(
  values: PageHeroesFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<PageHeroesFormValues>>>,
): PageHeroesChanges {
  const changes: PageHeroesChanges = {};

  for (const { page } of heroFields) {
    const hero = values[page];

    if (hero instanceof File) {
      changes[page] = { file: hero, type: "upload" };
    } else if (hero === null && dirtyFields[page]) {
      changes[page] = { type: "delete" };
    }
  }

  return changes;
}
