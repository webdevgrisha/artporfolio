import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type GalleryMaterials, galleryMaterialsSchema } from "#modules/gallery-materials/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { byTitle } from "#shared/text/titles";

const noMaterials: GalleryMaterials = { materials: [] };

/** The document that holds every material of the gallery, and nothing else. */
function materialsDocument() {
  return firestore().doc("site/galleryMaterials");
}

function readMaterials(snapshot: DocumentSnapshot): GalleryMaterials {
  return snapshot.exists ? galleryMaterialsSchema.parse(snapshot.data()) : noMaterials;
}

/** The materials with the entity tag for If-Match; there are none until they are first saved. */
export async function getGalleryMaterials(): Promise<Tagged<GalleryMaterials>> {
  const materials = readMaterials(await materialsDocument().get());

  return { data: materials, etag: entityTag(materials) };
}

/**
 * Replaces every material while they are still the ones the client read (`ifMatch`). They are
 * stored sorted by title, as the site and the admin list them.
 */
export async function replaceGalleryMaterials(
  body: GalleryMaterials,
  ifMatch: string,
): Promise<Tagged<GalleryMaterials>> {
  const materials = { materials: body.materials.toSorted(byTitle) };

  await firestore().runTransaction(async (transaction) => {
    const document = materialsDocument();

    assertIfMatch(ifMatch, readMaterials(await transaction.get(document)));
    transaction.set(document, materials);
  });

  return { data: materials, etag: entityTag(materials) };
}
