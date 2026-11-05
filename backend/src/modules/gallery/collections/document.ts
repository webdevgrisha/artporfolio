import { firestore } from "#shared/firebase/firestore";

/** Every collection; works read it to check the collection they are in. */
export function collectionsCollection() {
  return firestore().collection("galleryCollections");
}

export function collectionDocument(id: string) {
  return collectionsCollection().doc(id);
}
