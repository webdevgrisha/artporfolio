import { beforeEach, describe, expect, it, vi } from "vitest";

const firebase = vi.hoisted(() => ({
  createSessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
}));

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => firebase,
}));

import { UnauthorizedError } from "#errors/httpError";
import { createSession, revokeSession, verifySession } from "#services/auth/index";

const adminClaims = {
  auth_time: Math.floor(Date.now() / 1_000),
  email: "admin@example.com",
  uid: "admin-uid",
};

beforeEach(() => {
  process.env.ADMIN_UID = adminClaims.uid;
  process.env.SESSION_TTL_MINUTES = "60";

  vi.clearAllMocks();
  firebase.createSessionCookie.mockResolvedValue("session-cookie");
  firebase.revokeRefreshTokens.mockResolvedValue(undefined);
  firebase.verifyIdToken.mockResolvedValue(adminClaims);
  firebase.verifySessionCookie.mockResolvedValue(adminClaims);
});

describe("auth service", () => {
  it("creates a session for a recently authenticated admin", async () => {
    await expect(createSession("id-token")).resolves.toEqual({
      sessionCookie: "session-cookie",
      user: { email: adminClaims.email, uid: adminClaims.uid },
    });

    expect(firebase.verifyIdToken).toHaveBeenCalledWith("id-token", true);
    expect(firebase.createSessionCookie).toHaveBeenCalledWith("id-token", {
      expiresIn: 60 * 60 * 1_000,
    });
  });

  it("rejects a valid Firebase user who is not the configured admin", async () => {
    firebase.verifyIdToken.mockResolvedValue({ ...adminClaims, uid: "customer-uid" });

    await expect(createSession("id-token")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(firebase.createSessionCookie).not.toHaveBeenCalled();
  });

  it("rejects an ID token from an old sign-in", async () => {
    firebase.verifyIdToken.mockResolvedValue({
      ...adminClaims,
      auth_time: Math.floor((Date.now() - 10 * 60 * 1_000) / 1_000),
    });

    await expect(createSession("id-token")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(firebase.createSessionCookie).not.toHaveBeenCalled();
  });

  it("checks revocation when verifying an admin session", async () => {
    await expect(verifySession("session-cookie")).resolves.toEqual({
      email: adminClaims.email,
      uid: adminClaims.uid,
    });

    expect(firebase.verifySessionCookie).toHaveBeenCalledWith("session-cookie", true);
  });

  it("revokes refresh tokens only for the configured admin", async () => {
    await revokeSession("session-cookie");

    expect(firebase.revokeRefreshTokens).toHaveBeenCalledWith(adminClaims.uid);

    firebase.verifySessionCookie.mockResolvedValue({ ...adminClaims, uid: "customer-uid" });
    await revokeSession("other-session-cookie");

    expect(firebase.revokeRefreshTokens).toHaveBeenCalledOnce();
  });
});
