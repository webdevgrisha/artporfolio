import { firestore } from "#shared/firebase/firestore";

/** Every work; a collection reads it to find its works. */
export function worksCollection() {
  return firestore().collection("galleryWorks");
}

export function workDocument(id: string) {
  return worksCollection().doc(id);
}
