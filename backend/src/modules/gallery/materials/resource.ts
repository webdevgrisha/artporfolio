import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryMaterials, galleryMaterialsSchema } from "#modules/gallery/materials/schema";
import { firestore } from "#shared/firebase/firestore";
import { documentResource } from "#shared/http/document-resource";
import { textsById } from "#shared/i18n/translations";

/** Every material of the gallery, in the order the site and the admin list them. */
export const galleryMaterials = documentResource<GalleryMaterials>({
  document: () => firestore().doc("site/galleryMaterials"),
  empty: { materials: [] },
  schema: galleryMaterialsSchema,
  translated: {
    resource: "gallery-materials",
    texts: ({ materials }) => textsById(materials, ({ title }) => title),
  },
});

/** The ids of every saved material, which a work may refer to. */
export function materialIdsIn(snapshot: DocumentSnapshot): Set<string> {
  return new Set(galleryMaterials.read(snapshot).materials.map((material) => material.id));
}
