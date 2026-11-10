import { contactsDocument } from "#modules/contacts/document";
import { contactLinks } from "#modules/contacts/links/resource";
import { contactPhoto } from "#modules/contacts/photo";
import type { ContactsResponse } from "#modules/contacts/schema";
import type { Language } from "#shared/i18n/languages";
import { readTranslations, translatedText } from "#shared/i18n/translated-text";
import { toPhoto } from "#shared/images/photo";
import { readSlot } from "#shared/images/slot";

/** One read for the whole page: the links, and the contact photo with its alt text in `language`. */
export async function getContacts(language: Language): Promise<ContactsResponse> {
  const [snapshot, translations] = await Promise.all([
    contactsDocument().get(),
    readTranslations(contactPhoto.resource, language),
  ]);
  const photo = readSlot(contactPhoto, snapshot);

  return {
    links: contactLinks.read(snapshot),
    photo: photo && {
      ...toPhoto(photo),
      alt: translatedText(translations, language, "alt", photo.alt),
    },
  };
}
