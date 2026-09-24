import { getAuthConfig } from "#config/authConfig";
import { UnauthorizedError } from "#errors/httpError";
import { firebaseAuth, isAllowedAdmin, toAuthUser } from "#services/auth/firebaseAuth";
import type { AuthUser } from "#services/auth/types";

export async function verifySession(sessionCookie: string | undefined): Promise<AuthUser> {
  if (!sessionCookie) {
    throw new UnauthorizedError();
  }

  const config = getAuthConfig();

  try {
    const claims = await firebaseAuth().verifySessionCookie(sessionCookie, true);

    if (!isAllowedAdmin(claims, config.adminUid)) {
      throw new UnauthorizedError();
    }

    return toAuthUser(claims);
  } catch {
    throw new UnauthorizedError();
  }
}
