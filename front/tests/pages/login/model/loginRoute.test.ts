import { FirebaseError } from "firebase/app";
import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "@/features/login/model/login";
import { loginAction, loginLoader } from "@/pages/login/model/loginRoute";

import { problem } from "../../../support/handlers";
import { formActionArgs, routeArgs, thrownResponse } from "../../../support/router";
import { server } from "../../../support/server";

vi.mock("@/features/login/model/login", () => ({ login: vi.fn() }));

const user = { email: "admin@example.com", uid: "admin-uid" };
const credentials = { email: "admin@example.com", password: "secret" };

beforeEach(() => {
  vi.mocked(login).mockReset().mockResolvedValue(user);
});

describe("loginLoader", () => {
  it("shows the login page without a session", async () => {
    server.use(mswHttp.get("/api/auth/me", () => problem(401)));

    await expect(loginLoader(routeArgs("/admin/login"))).resolves.toBeNull();
  });

  it("sends a signed-in user back to the admin page they came from", async () => {
    server.use(mswHttp.get("/api/auth/me", () => HttpResponse.json({ user })));

    const response = await thrownResponse(
      loginLoader(routeArgs("/admin/login?redirectTo=%2Fadmin%2Fabout%3Ftab%3Dphoto")),
    );

    expect(response.headers.get("Location")).toBe("/admin/about?tab=photo");
  });

  it.each(["https://example.com/admin/", "//example.com/admin/", "/"])(
    "never sends a signed-in user to %s",
    async (redirectTo) => {
      server.use(mswHttp.get("/api/auth/me", () => HttpResponse.json({ user })));

      const response = await thrownResponse(
        loginLoader(routeArgs(`/admin/login?${new URLSearchParams({ redirectTo }).toString()}`)),
      );

      expect(response.headers.get("Location")).toBe("/admin/projects");
    },
  );
});

describe("loginAction", () => {
  it("signs in and opens the admin page the user came from", async () => {
    const response = await loginAction(
      formActionArgs("/admin/login", { ...credentials, redirectTo: "/admin/contacts" }),
    );

    expect(login).toHaveBeenCalledWith(credentials);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).headers.get("Location")).toBe("/admin/contacts");
  });

  it("opens the admin home page instead of an outside URL", async () => {
    const response = await loginAction(
      formActionArgs("/admin/login", { ...credentials, redirectTo: "https://example.com" }),
    );

    expect((response as Response).headers.get("Location")).toBe("/admin/projects");
  });

  // The form checks the fields before it is sent; the action does not trust it.
  it("does not sign in with fields that the form would not send", async () => {
    await expect(
      loginAction(formActionArgs("/admin/login", { email: "admin", password: "secret" })),
    ).resolves.toEqual({ error: "Не удалось выполнить вход. Попробуйте ещё раз" });
    expect(login).not.toHaveBeenCalled();
  });

  it("explains a failed sign-in", async () => {
    vi.mocked(login).mockRejectedValue(new FirebaseError("auth/too-many-requests", "Firebase"));

    await expect(loginAction(formActionArgs("/admin/login", credentials))).resolves.toEqual({
      error: "Слишком много попыток входа. Попробуйте позже",
    });
  });
});
