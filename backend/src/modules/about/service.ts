import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import { processPhotoTranslations, readProcessPhotos } from "#modules/about/process-photos/service";
import type { AboutResponse } from "#modules/about/schema";
import { aboutText, aboutTextTranslations } from "#modules/about/text/resource";
import type { Language } from "#shared/i18n/languages";
import { readEachTranslations, translatedText } from "#shared/i18n/translated-text";
import { toPhoto } from "#shared/images/photo";
import { toListPhoto } from "#shared/images/photo-list";
import { readSlot } from "#shared/images/slot";

/**
 * One read for the whole page: the texts, «My photo» and the process photos, with the texts and
 * the alt texts in `language`.
 */
export async function getAbout(language: Language): Promise<AboutResponse> {
  const [snapshot, [textTranslations = {}, photoTranslations = {}, processTranslations = {}]] =
    await Promise.all([
      aboutDocument().get(),
      readEachTranslations(
        [aboutTextTranslations, aboutPhoto.resource, processPhotoTranslations],
        language,
      ),
    ]);
  const text = aboutText.read(snapshot);
  const photo = readSlot(aboutPhoto, snapshot);

  return {
    text: {
      about: translatedText(textTranslations, language, "about", text.about),
      biography: translatedText(textTranslations, language, "biography", text.biography),
      creation: translatedText(textTranslations, language, "creation", text.creation),
    },
    photo: photo && {
      ...toPhoto(photo),
      alt: translatedText(photoTranslations, language, "alt", photo.alt),
    },
    processPhotos: readProcessPhotos(snapshot).map((processPhoto) => ({
      ...toListPhoto(processPhoto),
      alt: translatedText(processTranslations, language, processPhoto.id, processPhoto.alt),
    })),
  };
}
