import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import { readProcessPhotos, toProcessPhoto } from "#modules/about/process-photos/service";
import type { AboutResponse } from "#modules/about/schema";
import { readAboutText } from "#modules/about/text/service";
import { readPhoto, toPhoto } from "#shared/images/photo";

/** One read for the whole page: the texts, «My photo» and the process photos. */
export async function getAbout(): Promise<AboutResponse> {
  const snapshot = await aboutDocument().get();
  const photo = readPhoto(aboutPhoto, snapshot);

  return {
    text: readAboutText(snapshot),
    photo: photo && toPhoto(photo),
    processPhotos: readProcessPhotos(snapshot).map(toProcessPhoto),
  };
}
