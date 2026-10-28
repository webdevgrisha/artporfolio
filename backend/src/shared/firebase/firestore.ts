import { getFirestore } from "firebase-admin/firestore";

import { firebaseApp } from "#shared/firebase/app";

export function firestore() {
  return getFirestore(firebaseApp());
}
