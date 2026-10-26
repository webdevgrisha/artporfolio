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

function authError(code: string) {
  return Object.assign(new Error(code), { code });
}

const adminClaims = {
  auth_time: Math.floor(Date.now() / 1_000),
  email: "admin@example.com",
  uid: "admin-uid",
};

beforeEach(() => {
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

  it("propagates a failure to revoke refresh tokens", async () => {
    const providerError = new Error("Firebase is unavailable");
    firebase.revokeRefreshTokens.mockRejectedValue(providerError);

    await expect(revokeSession("session-cookie")).rejects.toBe(providerError);
  });

  it("allows logout when the session cookie is already invalid", async () => {
    firebase.verifySessionCookie.mockRejectedValue(authError("auth/session-cookie-expired"));

    await expect(revokeSession("invalid-session-cookie")).resolves.toBeUndefined();
    expect(firebase.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("rejects an invalid ID token as unauthorized", async () => {
    firebase.verifyIdToken.mockRejectedValue(authError("auth/id-token-expired"));

    await expect(createSession("id-token")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("propagates infrastructure failures while creating a session", async () => {
    const permissionError = authError("auth/insufficient-permission");
    firebase.createSessionCookie.mockRejectedValue(permissionError);

    await expect(createSession("id-token")).rejects.toBe(permissionError);
  });

  it("propagates provider outages while creating a session", async () => {
    const providerError = new Error("Firebase is unavailable");
    firebase.verifyIdToken.mockRejectedValue(providerError);

    await expect(createSession("id-token")).rejects.toBe(providerError);
  });

  it("rejects a revoked session cookie as unauthorized", async () => {
    firebase.verifySessionCookie.mockRejectedValue(authError("auth/session-cookie-revoked"));

    await expect(verifySession("session-cookie")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a session that does not belong to the configured admin", async () => {
    firebase.verifySessionCookie.mockResolvedValue({ ...adminClaims, uid: "customer-uid" });

    await expect(verifySession("session-cookie")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("propagates provider outages while verifying a session", async () => {
    const providerError = new Error("Firebase is unavailable");
    firebase.verifySessionCookie.mockRejectedValue(providerError);

    await expect(verifySession("session-cookie")).rejects.toBe(providerError);
  });

  it("propagates provider outages while checking the session on logout", async () => {
    const providerError = new Error("Firebase is unavailable");
    firebase.verifySessionCookie.mockRejectedValue(providerError);

    await expect(revokeSession("session-cookie")).rejects.toBe(providerError);
  });
});
