import type { SitePages } from "@/entities/site-page";

import { heroFields } from "./heroFields";
import type { PageHeroesChanges } from "./pageHeroesChanges";
import type { PageHeroesFormValues } from "./pageHeroesFormValues";

/** Picks the pages whose submitted hero differs from the saved one. */
export function getPageHeroesChanges(
  values: PageHeroesFormValues,
  saved: SitePages,
): PageHeroesChanges {
  const changes: PageHeroesChanges = {};

  // Compared by value: react-hook-form does not track changes inside a File.
  for (const { page } of heroFields) {
    const hero = values[page];

    if (hero instanceof File) {
      changes[page] = { file: hero, type: "upload" };
    } else if (hero === null && saved[page].hero) {
      changes[page] = { type: "delete" };
    }
  }

  return changes;
}
