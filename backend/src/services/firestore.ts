import { getFirestore } from "firebase-admin/firestore";

import { firebaseApp } from "#services/firebaseApp";

export function firestore() {
  return getFirestore(firebaseApp());
}
