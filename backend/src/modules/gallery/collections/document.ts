import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type StoredCollection, storedCollectionSchema } from "#modules/gallery/collections/schema";
import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";

/** Every collection; works read it to check the collection they are in. */
export function collectionsCollection() {
  return firestore().collection("galleryCollections");
}

export function collectionDocument(id: string) {
  return collectionsCollection().doc(id);
}

export function readCollection(snapshot: DocumentSnapshot): StoredCollection {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no collection");
  }

  return storedCollectionSchema.parse(snapshot.data());
}
