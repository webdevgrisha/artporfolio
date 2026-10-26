import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword } from "firebase/auth";

import { firebaseAuth } from "@/shared/api/firebase";

interface SignInCredentials {
  email: string;
  password: string;
}

export async function signInWithFirebase({ email, password }: SignInCredentials): Promise<string> {
  await setPersistence(firebaseAuth, inMemoryPersistence);

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);

  return credential.user.getIdToken();
}
