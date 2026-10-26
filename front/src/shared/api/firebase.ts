import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

import { firebaseAuthEmulatorUrl, firebaseConfig } from "@/shared/config/firebase";

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

if (firebaseAuthEmulatorUrl) {
  connectAuthEmulator(firebaseAuth, firebaseAuthEmulatorUrl, { disableWarnings: true });
}
