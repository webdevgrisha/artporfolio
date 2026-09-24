import { getAuthConfig } from "#config/authConfig";
import { firebaseAuth, isAllowedAdmin } from "#services/auth/firebaseAuth";

export async function revokeSession(sessionCookie: string | undefined): Promise<void> {
  if (!sessionCookie) {
    return;
  }

  const config = getAuthConfig();

  try {
    const claims = await firebaseAuth().verifySessionCookie(sessionCookie);

    if (isAllowedAdmin(claims, config.adminUid)) {
      await firebaseAuth().revokeRefreshTokens(claims.uid);
    }
  } catch {
    // Logout remains successful when the cookie is already invalid or expired.
  }
}
