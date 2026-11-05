import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryColors, galleryColorsSchema } from "#modules/gallery/colors/schema";
import { firestore } from "#shared/firebase/firestore";
import { documentResource } from "#shared/http/document-resource";

/** Every color of the gallery, in the order the site and the admin list them. */
export const galleryColors = documentResource<GalleryColors>({
  document: () => firestore().doc("site/galleryColors"),
  empty: { colors: [] },
  schema: galleryColorsSchema,
});

/** The ids of every saved color, which a work may refer to. */
export function colorIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(galleryColors.read(snapshot).colors.map((color) => color.id));
}
