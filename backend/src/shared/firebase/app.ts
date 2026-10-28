import { getApps, initializeApp } from "firebase-admin/app";

/** The default Firebase Admin app; credentials come from the Functions runtime. */
export function firebaseApp() {
  return getApps()[0] ?? initializeApp();
}
