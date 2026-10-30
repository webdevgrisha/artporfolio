import { deletePageHero, type SitePageId, uploadPageHero } from "@/entities/site-page";
import { isSessionExpiredError } from "@/shared/api/getRequestErrorMessage";
import { joinMessages } from "@/shared/lib/joinMessages";

import { getSaveHeroErrorMessage } from "../lib/saveErrorMessages";
import { heroFields } from "./heroFields";
import type { HeroChange, PageHeroesChanges } from "./pageHeroesChanges";

export interface SavePageHeroesResult {
  /** Why some page was not saved. */
  error?: string;
  /** The pages whose change was saved. */
  savedPages: SitePageId[];
}

async function saveHero(page: SitePageId, change: HeroChange): Promise<void> {
  if (change.type === "upload") {
    await uploadPageHero({ file: change.file, page });
  } else {
    await deletePageHero({ page });
  }
}

/**
 * Saves the changed pages one at a time: the server encodes every photo it receives, and several
 * large photos at once would compete for one instance. The pages are independent, so a page that
 * fails keeps its changes and does not stop the others. Failures are reported in `error`.
 */
export async function savePageHeroes(changes: PageHeroesChanges): Promise<SavePageHeroesResult> {
  const savedPages: SitePageId[] = [];
  const errors = new Set<string>();

  for (const { label, page } of heroFields) {
    const change = changes[page];
    if (!change) continue;

    try {
      await saveHero(page, change);
      savedPages.push(page);
    } catch (error) {
      errors.add(getSaveHeroErrorMessage(error, label));
      // Without a session every other page is rejected too.
      if (isSessionExpiredError(error)) break;
    }
  }

  // Pages usually fail for the same reason, such as no connection: it is said once.
  return { error: joinMessages(errors), savedPages };
}
