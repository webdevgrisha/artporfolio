import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import { readProcessPhotos } from "#modules/about/process-photos/service";
import type { AboutResponse } from "#modules/about/schema";
import { aboutText } from "#modules/about/text/resource";
import { toPhoto } from "#shared/images/photo";
import { toListPhoto } from "#shared/images/photo-list";
import { readSlot } from "#shared/images/slot";

/** One read for the whole page: the texts, «My photo» and the process photos. */
export async function getAbout(): Promise<AboutResponse> {
  const snapshot = await aboutDocument().get();
  const photo = readSlot(aboutPhoto, snapshot);

  return {
    text: aboutText.read(snapshot),
    photo: photo && toPhoto(photo),
    processPhotos: readProcessPhotos(snapshot).map(toListPhoto),
  };
}
