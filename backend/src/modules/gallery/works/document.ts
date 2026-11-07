import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type StoredWork, storedWorkSchema } from "#modules/gallery/works/schema";
import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";

/** Every work; a collection reads it to find its works. */
export function worksCollection() {
  return firestore().collection("galleryWorks");
}

export function workDocument(id: string) {
  return worksCollection().doc(id);
}

export function readWork(snapshot: DocumentSnapshot): StoredWork {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no work");
  }

  return storedWorkSchema.parse(snapshot.data());
}
