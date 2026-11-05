import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryPalettes, galleryPalettesSchema } from "#modules/gallery/palettes/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { byTitle } from "#shared/text/titles";

const noPalettes: GalleryPalettes = { palettes: [] };

/** The document that holds every palette of the gallery, and nothing else. */
export function palettesDocument() {
  return firestore().doc("site/galleryPalettes");
}

function readPalettes(snapshot: DocumentSnapshot): GalleryPalettes {
  return snapshot.exists ? galleryPalettesSchema.parse(snapshot.data()) : noPalettes;
}

/** The ids of every saved palette, which a work may refer to. */
export function paletteIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(readPalettes(snapshot).palettes.map((palette) => palette.id));
}

/** The palettes with the entity tag for If-Match; there are none until they are first saved. */
export async function getGalleryPalettes(): Promise<Tagged<GalleryPalettes>> {
  const palettes = readPalettes(await palettesDocument().get());

  return { data: palettes, etag: entityTag(palettes) };
}

/**
 * Replaces every palette while they are still the ones the client read (`ifMatch`). They are
 * stored sorted by title, as the site and the admin list them.
 */
export async function replaceGalleryPalettes(
  body: GalleryPalettes,
  ifMatch: string,
): Promise<Tagged<GalleryPalettes>> {
  const palettes = { palettes: body.palettes.toSorted(byTitle) };

  await firestore().runTransaction(async (transaction) => {
    const document = palettesDocument();

    assertIfMatch(ifMatch, readPalettes(await transaction.get(document)));
    transaction.set(document, palettes);
  });

  return { data: palettes, etag: entityTag(palettes) };
}
