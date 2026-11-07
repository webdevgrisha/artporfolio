import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryPalettes, galleryPalettesSchema } from "#modules/gallery/palettes/schema";
import { firestore } from "#shared/firebase/firestore";
import { translatedResource } from "#shared/i18n/translated-resource";
import { textsById } from "#shared/i18n/translations";

/** Every palette of the gallery, in the order the site and the admin list them. */
export const galleryPalettes = translatedResource<GalleryPalettes>({
  document: () => firestore().doc("site/galleryPalettes"),
  empty: { palettes: [] },
  schema: galleryPalettesSchema,
  sources: ({ palettes }) => textsById(palettes, ({ title }) => title),
});

/** The ids of every saved palette, which a work may refer to. */
export function paletteIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(galleryPalettes.read(snapshot).palettes.map((palette) => palette.id));
}
