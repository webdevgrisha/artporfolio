import { aboutDocument } from "#modules/about/document";
import { readProcessPhotos, toProcessPhoto } from "#modules/about/process-photos/service";
import { type AboutResponse, type AboutText, storedAboutTextSchema } from "#modules/about/schema";
import { readPhoto, toPhoto } from "#shared/images/photo";

/** One read for the whole page: the texts, «My photo» and the process photos. */
export async function getAbout(): Promise<AboutResponse> {
  const snapshot = await aboutDocument().get();
  const text: unknown = snapshot.get("text");
  const photo = readPhoto(snapshot, "photo");

  return {
    text: text === undefined ? null : storedAboutTextSchema.parse(text),
    photo: photo && toPhoto(photo),
    processPhotos: readProcessPhotos(snapshot).map(toProcessPhoto),
  };
}

export async function saveAboutText(text: AboutText): Promise<void> {
  // Merging keeps the photos, which live in the same document.
  await aboutDocument().set({ text }, { merge: true });
}
