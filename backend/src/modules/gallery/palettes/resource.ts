import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryPalettes, galleryPalettesSchema } from "#modules/gallery/palettes/schema";
import { documentResource } from "#shared/firebase/document-resource";
import { firestore } from "#shared/firebase/firestore";
import { textsById } from "#shared/i18n/translations";

/** Every palette of the gallery, in the order the site and the admin list them. */
export const galleryPalettes = documentResource<GalleryPalettes>({
  document: () => firestore().doc("site/galleryPalettes"),
  empty: { palettes: [] },
  schema: galleryPalettesSchema,
  translated: {
    resource: "gallery-palettes",
    texts: ({ palettes }) => textsById(palettes, ({ title }) => title),
  },
});

/** The ids of every saved palette, which a work may refer to. */
export function paletteIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(galleryPalettes.read(snapshot).palettes.map((palette) => palette.id));
}
