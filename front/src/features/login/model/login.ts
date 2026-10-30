import { signOut } from "firebase/auth";

import type { AuthUser } from "@/entities/user";
import { firebaseAuth } from "@/shared/api/firebase";

import { createSession } from "../api/sessionApi";
import { signInWithFirebase } from "../api/signInWithFirebase";

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Checks the password with Firebase and exchanges the ID token for an API session cookie. */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    const idToken = await signInWithFirebase(credentials);

    return await createSession({ idToken });
  } finally {
    // The API session cookie is the only session; the Firebase client session is not kept.
    await signOut(firebaseAuth).catch(() => undefined);
  }
}
