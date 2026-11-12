import { type ContactLinks, contactLinksSchema } from "@/lib/api/contacts";
import { getJson } from "@/lib/api/getJson";
import type { Language } from "@/lib/i18n/languages";

/**
 * The links of the artist for the menu and the footer of a page. They only lead elsewhere: when
 * the API cannot answer, the page is still shown, without them.
 */
export async function loadContactLinks(language: Language): Promise<ContactLinks | undefined> {
  try {
    // Their own resource, without the photos of the Contacts page, which no other page needs.
    return await getJson("contacts/links", contactLinksSchema, { language });
  } catch (error) {
    console.error("The page is shown without the links of the artist:", error);

    return undefined;
  }
}
