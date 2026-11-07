import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import {
  readProcessPhotos,
  toProcessPhotoTranslations,
} from "#modules/about/process-photos/service";
import type { AboutResponse } from "#modules/about/schema";
import { aboutText } from "#modules/about/text/resource";
import { readPhoto, toSlotPhoto } from "#shared/images/photo";
import { toListPhoto } from "#shared/images/photo-list";

/** One read for the whole page: the texts, «My photo» and the process photos. */
export async function getAbout(): Promise<AboutResponse> {
  const snapshot = await aboutDocument().get();
  const photo = readPhoto(aboutPhoto, snapshot);

  return {
    text: aboutText.toResponse(aboutText.read(snapshot)),
    photo: photo && toSlotPhoto(photo),
    processPhotos: readProcessPhotos(snapshot).map(toListPhoto),
    processPhotoTranslations: toProcessPhotoTranslations(snapshot),
  };
}
