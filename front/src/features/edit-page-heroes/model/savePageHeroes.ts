import {
  deletePageHero,
  type SitePageId,
  type SitePages,
  uploadPageHero,
} from "@/entities/site-page";
import { getCsrfToken } from "@/shared/api/csrf";
import { isSessionExpiredError } from "@/shared/api/getRequestErrorMessage";
import type { Image } from "@/shared/api/image";

import { getSaveHeroErrorMessage } from "../lib/saveErrorMessages";
import { heroFields } from "./heroFields";
import type { HeroChange, PageHeroesChanges } from "./pageHeroesChanges";

export interface SavePageHeroesResult {
  /** Why some page was not saved. */
  error?: string;
  /** The saved pages with their new hero. A page that failed or was not changed is left out. */
  pages: Partial<SitePages>;
}

async function saveHero(
  page: SitePageId,
  change: HeroChange,
  csrfToken: string,
): Promise<Image | null> {
  switch (change.type) {
    case "upload":
      return uploadPageHero({ csrfToken, file: change.file, page });
    case "delete":
      await deletePageHero({ csrfToken, page });
      return null;
  }
}

/**
 * Saves the changed pages one at a time: the server encodes every photo it receives, and several
 * large photos at once would compete for one instance. The pages are independent, so a page that
 * fails keeps its changes and does not stop the others.
 */
export async function savePageHeroes(changes: PageHeroesChanges): Promise<SavePageHeroesResult> {
  const csrfToken = await getCsrfToken();
  const pages: Partial<SitePages> = {};
  const errors = new Set<string>();

  for (const { label, page } of heroFields) {
    const change = changes[page];
    if (!change) continue;

    try {
      pages[page] = { hero: await saveHero(page, change, csrfToken) };
    } catch (error) {
      errors.add(getSaveHeroErrorMessage(error, label));
      // Without a session every other page is rejected too.
      if (isSessionExpiredError(error)) break;
    }
  }

  // Pages usually fail for the same reason, such as no connection: it is said once.
  return errors.size > 0 ? { error: [...errors].join(". "), pages } : { pages };
}
