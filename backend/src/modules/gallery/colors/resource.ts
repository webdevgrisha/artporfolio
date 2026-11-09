import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryColors, galleryColorsSchema } from "#modules/gallery/colors/schema";
import { documentResource } from "#shared/firebase/document-resource";
import { firestore } from "#shared/firebase/firestore";
import { textsById } from "#shared/i18n/translations";

/** Every color of the gallery, in the order the site and the admin list them. */
export const galleryColors = documentResource<GalleryColors>({
  document: () => firestore().doc("site/galleryColors"),
  empty: { colors: [] },
  schema: galleryColorsSchema,
  translated: {
    resource: "gallery-colors",
    texts: ({ colors }) => textsById(colors, ({ title }) => title),
  },
});

/** The ids of every saved color, which a work may refer to. */
export function colorIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(galleryColors.read(snapshot).colors.map((color) => color.id));
}
