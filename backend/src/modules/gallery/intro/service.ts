import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryIntro, galleryIntroSchema } from "#modules/gallery/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

const emptyIntro: GalleryIntro = { text: "" };

/** The document that holds the text above the works in the gallery, and nothing else. */
function introDocument() {
  return firestore().doc("site/galleryIntro");
}

function readIntro(snapshot: DocumentSnapshot): GalleryIntro {
  return snapshot.exists ? galleryIntroSchema.parse(snapshot.data()) : emptyIntro;
}

/** The text with the entity tag for If-Match; the text is empty until it is first saved. */
export async function getGalleryIntro(): Promise<Tagged<GalleryIntro>> {
  const intro = readIntro(await introDocument().get());

  return { data: intro, etag: entityTag(intro) };
}

/** Replaces the text while it is still the one the client read (`ifMatch`). */
export async function replaceGalleryIntro(
  intro: GalleryIntro,
  ifMatch: string,
): Promise<Tagged<GalleryIntro>> {
  await firestore().runTransaction(async (transaction) => {
    const document = introDocument();

    assertIfMatch(ifMatch, readIntro(await transaction.get(document)));
    transaction.set(document, intro);
  });

  return { data: intro, etag: entityTag(intro) };
}
