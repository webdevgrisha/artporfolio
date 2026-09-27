import { signOut } from "firebase/auth";

import { createSession, getCsrfToken } from "@/api/auth";
import type { AuthUser } from "@/api/auth/schemas";
import { firebaseAuth } from "@/firebase/client";
import { signIn } from "@/firebase/signIn";

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    const idToken = await signIn(credentials);
    const csrfToken = await getCsrfToken();

    return await createSession({ csrfToken, idToken });
  } finally {
    await signOut(firebaseAuth).catch(() => undefined);
  }
}
