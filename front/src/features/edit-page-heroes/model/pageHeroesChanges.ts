import type { SitePageId, SitePages } from "@/entities/site-page";

import { heroFields } from "./heroFields";
import type { PageHeroesFormValues } from "./pageHeroesFormValues";

export type HeroChange = { file: File; type: "upload" } | { type: "delete" };

/** What a save sends to the server: only the pages whose hero was changed. */
export type PageHeroesChanges = Partial<Record<SitePageId, HeroChange>>;

/** Picks the pages whose submitted hero differs from the one on the server. */
export function getPageHeroesChanges(
  values: PageHeroesFormValues,
  pages: SitePages,
): PageHeroesChanges {
  const changes: PageHeroesChanges = {};

  // Compared by value: react-hook-form does not track changes inside a File.
  for (const { page } of heroFields) {
    const hero = values[page];

    if (hero instanceof File) {
      changes[page] = { file: hero, type: "upload" };
    } else if (hero === null && pages[page].hero) {
      changes[page] = { type: "delete" };
    }
  }

  return changes;
}
