import { worksCollection } from "#modules/gallery/works/document";
import { worksInOrder } from "#modules/gallery/works/order";
import { workTranslations } from "#modules/gallery/works/translations";
import { isVisibleTo } from "#modules/gallery/works/visibility";
import type { Language } from "#shared/i18n/languages";
import { readEachTranslations, translatedText } from "#shared/i18n/translated-text";
import { type Photo, toPhoto } from "#shared/images/photo";

/**
 * The photos of the published works that are wider than tall, in the order of the gallery, with
 * their alt texts in `language`. A landscape frame, such as the slideshow of the contacts page,
 * shows them whole: a portrait or square work would lose its top and bottom.
 */
export async function landscapeWorkPhotos(language: Language): Promise<Photo[]> {
  const { docs } = await worksCollection().get();
  const works = worksInOrder(docs).filter(
    ({ work }) => isVisibleTo(work, "visitor") && work.photo.width > work.photo.height,
  );
  const translations = await readEachTranslations(
    works.map(({ id }) => workTranslations(id)),
    language,
  );

  return works.map(({ work }, index) => ({
    ...toPhoto(work.photo),
    alt: translatedText(translations[index] ?? {}, language, "alt", work.photo.alt),
  }));
}
