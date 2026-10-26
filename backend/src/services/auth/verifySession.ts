import { getEnv } from "#config/env";
import { UnauthorizedError } from "#errors/httpError";
import {
  firebaseAuth,
  isAllowedAdmin,
  isClientAuthError,
  toAuthUser,
} from "#services/auth/firebaseAuth";
import type { AuthUser } from "#services/auth/types";

export async function verifySession(sessionCookie: string | undefined): Promise<AuthUser> {
  if (!sessionCookie) {
    throw new UnauthorizedError();
  }

  const config = getEnv();

  try {
    const claims = await firebaseAuth().verifySessionCookie(sessionCookie, true);

    if (!isAllowedAdmin(claims, config.adminUid)) {
      throw new UnauthorizedError();
    }

    return toAuthUser(claims);
  } catch (error) {
    if (error instanceof UnauthorizedError || isClientAuthError(error)) {
      throw new UnauthorizedError();
    }

    throw error;
  }
}
