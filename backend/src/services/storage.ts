import { getStorage } from "firebase-admin/storage";

import { firebaseApp } from "#services/firebaseApp";

/** The project's default Cloud Storage bucket. */
export function storageBucket() {
  return getStorage(firebaseApp()).bucket();
}
