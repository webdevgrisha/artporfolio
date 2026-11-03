import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryColors, galleryColorsSchema } from "#modules/gallery-colors/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { byTitle } from "#shared/text/titles";

const noColors: GalleryColors = { colors: [] };

/** The document that holds every color of the gallery, and nothing else. */
function colorsDocument() {
  return firestore().doc("site/galleryColors");
}

function readColors(snapshot: DocumentSnapshot): GalleryColors {
  return snapshot.exists ? galleryColorsSchema.parse(snapshot.data()) : noColors;
}

/** The colors with the entity tag for If-Match; there are none until they are first saved. */
export async function getGalleryColors(): Promise<Tagged<GalleryColors>> {
  const colors = readColors(await colorsDocument().get());

  return { data: colors, etag: entityTag(colors) };
}

/**
 * Replaces every color while they are still the ones the client read (`ifMatch`). They are
 * stored sorted by title, as the site and the admin list them.
 */
export async function replaceGalleryColors(
  body: GalleryColors,
  ifMatch: string,
): Promise<Tagged<GalleryColors>> {
  const colors = { colors: body.colors.toSorted(byTitle) };

  await firestore().runTransaction(async (transaction) => {
    const document = colorsDocument();

    assertIfMatch(ifMatch, readColors(await transaction.get(document)));
    transaction.set(document, colors);
  });

  return { data: colors, etag: entityTag(colors) };
}
