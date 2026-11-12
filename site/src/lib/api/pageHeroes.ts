import { getJson } from "@/lib/api/getJson";
import type { Image } from "@/lib/api/image";
import { pagesSchema } from "@/lib/api/pages";
import type { Language } from "@/lib/i18n/languages";

/**
 * The hero of every page that has one, by the id of the page in the admin, such as `gallery`. They
 * only dress the menu: when the API cannot answer, the page is still shown, with a plain menu.
 */
export async function pageHeroes(language: Language): Promise<Record<string, Image>> {
  try {
    const { pages } = await getJson("pages", pagesSchema, { language });

    return Object.fromEntries(
      Object.entries(pages).flatMap(([page, { hero }]) => (hero ? [[page, hero]] : [])),
    );
  } catch (error) {
    console.error("The menu is shown without the photos of the pages:", error);

    return {};
  }
}
