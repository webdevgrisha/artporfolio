import { type ContactLinks, contactsSchema } from "@/lib/api/contacts";
import { getJson } from "@/lib/api/getJson";
import type { Language } from "@/lib/i18n/languages";

/**
 * The links of the artist for the menu and the footer of a page. They only lead elsewhere: when
 * the API cannot answer, the page is still shown, without them.
 */
export async function loadContactLinks(language: Language): Promise<ContactLinks | undefined> {
  try {
    const { links } = await getJson("contacts", contactsSchema, { language });

    return links;
  } catch (error) {
    console.error("The page is shown without the links of the artist:", error);

    return undefined;
  }
}
