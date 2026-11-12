import { contactsDocument } from "#modules/contacts/document";
import { contactLinks } from "#modules/contacts/links/resource";
import type { ContactsResponse } from "#modules/contacts/schema";
import { readSlideshow, slideshowTranslations } from "#modules/contacts/slideshow/service";
import { landscapeWorkPhotos } from "#modules/gallery/works/landscape-photos";
import type { Language } from "#shared/i18n/languages";
import { readTranslations, translatedText } from "#shared/i18n/translated-text";
import { type Photo, toPhoto } from "#shared/images/photo";
import type { StoredListPhoto } from "#shared/images/photo-list";

/** The uploaded photos of the slideshow, with their alt texts in `language`. */
async function uploadedPhotos(photos: StoredListPhoto[], language: Language): Promise<Photo[]> {
  if (photos.length === 0) {
    return [];
  }

  const translations = await readTranslations(slideshowTranslations, language);

  return photos.map((photo) => ({
    ...toPhoto(photo),
    alt: translatedText(translations, language, photo.id, photo.alt),
  }));
}

/** One read for the whole page: the links, and the photos of the slideshow with alt texts in `language`. */
export async function getContacts(language: Language): Promise<ContactsResponse> {
  const snapshot = await contactsDocument().get();
  const slideshow = readSlideshow(snapshot);

  return {
    links: contactLinks.read(snapshot),
    photos:
      slideshow.source === "gallery"
        ? await landscapeWorkPhotos(language)
        : await uploadedPhotos(slideshow.photos, language),
  };
}
