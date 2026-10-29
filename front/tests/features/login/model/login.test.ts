import { signOut } from "firebase/auth";
import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInWithFirebase } from "@/features/login/api/signInWithFirebase";
import { login } from "@/features/login/model/login";
import { HttpError } from "@/shared/api/httpError";

import { csrfHandler, csrfToken, problem } from "../../../support/handlers";
import { recordRequests, server } from "../../../support/server";

vi.mock("firebase/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/shared/api/firebase", () => ({ firebaseAuth: { name: "test-auth" } }));
vi.mock("@/features/login/api/signInWithFirebase", () => ({ signInWithFirebase: vi.fn() }));

const credentials = { email: "admin@example.com", password: "secret" };
const user = { email: "admin@example.com", uid: "admin-uid" };

beforeEach(() => {
  vi.mocked(signInWithFirebase).mockReset().mockResolvedValue("id-token");
  vi.mocked(signOut).mockReset().mockResolvedValue();
  server.use(csrfHandler);
});

describe("login", () => {
  it("exchanges the Firebase ID token for an API session", async () => {
    let received: { body: unknown; token: string | null } | undefined;
    server.use(
      mswHttp.post("/api/auth/login", async ({ request }) => {
        received = { body: await request.json(), token: request.headers.get("X-CSRF-Token") };
        return HttpResponse.json({ user });
      }),
    );

    await expect(login(credentials)).resolves.toEqual(user);
    expect(signInWithFirebase).toHaveBeenCalledWith(credentials);
    expect(received).toEqual({ body: { idToken: "id-token" }, token: csrfToken });
  });

  it("does not keep the Firebase session after a sign-in", async () => {
    server.use(mswHttp.post("/api/auth/login", () => HttpResponse.json({ user })));

    await login(credentials);

    expect(signOut).toHaveBeenCalledWith({ name: "test-auth" });
  });

  it("asks the API nothing when Firebase rejects the password, and still signs out", async () => {
    const error = new Error("auth/invalid-credential");
    vi.mocked(signInWithFirebase).mockRejectedValue(error);
    const requests = recordRequests();

    await expect(login(credentials)).rejects.toBe(error);
    expect(requests).toEqual([]);
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("rejects an account that is not the admin, and still signs out", async () => {
    server.use(mswHttp.post("/api/auth/login", () => problem(401)));

    await expect(login(credentials)).rejects.toEqual(new HttpError(401));
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("signs in even when the Firebase sign-out fails", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("auth/network-request-failed"));
    server.use(mswHttp.post("/api/auth/login", () => HttpResponse.json({ user })));

    await expect(login(credentials)).resolves.toEqual(user);
  });
});
