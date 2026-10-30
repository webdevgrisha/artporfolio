import { aboutDocument } from "#modules/about/document";
import { readAboutPhoto } from "#modules/about/photo/service";
import { readProcessPhotos, toProcessPhoto } from "#modules/about/process-photos/service";
import type { AboutResponse } from "#modules/about/schema";
import { readAboutText } from "#modules/about/text/service";
import { toPhoto } from "#shared/images/photo";

/** One read for the whole page: the texts, «My photo» and the process photos. */
export async function getAbout(): Promise<AboutResponse> {
  const snapshot = await aboutDocument().get();
  const photo = readAboutPhoto(snapshot);

  return {
    text: readAboutText(snapshot),
    photo: photo && toPhoto(photo),
    processPhotos: readProcessPhotos(snapshot).map(toProcessPhoto),
  };
}
