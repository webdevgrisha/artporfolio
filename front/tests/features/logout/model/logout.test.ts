import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logoutAction } from "@/features/logout";
import { queryClient } from "@/shared/api/queryClient";
import { showErrorToast } from "@/shared/ui/toast";

import { csrfHandler, noContent, problem } from "../../../support/handlers";
import { formActionArgs } from "../../../support/router";
import { server } from "../../../support/server";

vi.mock("@/shared/ui/toast", () => ({ showErrorToast: vi.fn() }));

function logout(returnTo: string) {
  return logoutAction(formActionArgs("/admin/logout", { returnTo }));
}

beforeEach(() => {
  vi.mocked(showErrorToast).mockReset();
  queryClient.setQueryData(["about"], { text: null });
  server.use(
    csrfHandler,
    mswHttp.post("/api/auth/logout", () => noContent()),
  );
});

describe("logoutAction", () => {
  it("ends the session, forgets its data and goes to the login page", async () => {
    const response = await logout("/admin/about");

    expect(response.headers.get("Location")).toBe("/admin/login");
    expect(queryClient.getQueryData(["about"])).toBeUndefined();
  });

  it("signs out when the server fails after it has cleared the session cookie", async () => {
    server.use(mswHttp.post("/api/auth/logout", () => problem(500)));

    const response = await logout("/admin/about");

    expect(response.headers.get("Location")).toBe("/admin/login");
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("goes to the login page when the session is already gone", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => problem(401)));

    const response = await logout("/admin/about");

    expect(response.headers.get("Location")).toBe("/admin/login");
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the logout was refused",
      () => server.use(mswHttp.post("/api/auth/logout", () => problem(403))),
    ],
    [
      "the server was not reached",
      () => server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error())),
    ],
  ])("keeps the user on their page when %s", async (_name, failLogout) => {
    failLogout();

    const response = await logout("/admin/about");

    expect(response.headers.get("Location")).toBe("/admin/about");
    expect(queryClient.getQueryData(["about"])).toEqual({ text: null });
    expect(showErrorToast).toHaveBeenCalledOnce();
  });

  it("names the reason of a failed logout", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));

    await logout("/admin/about");

    expect(showErrorToast).toHaveBeenCalledWith(
      "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз",
      { id: "logout" },
    );
  });

  it.each(["https://example.com/admin/", "//example.com/admin/", "/login"])(
    "returns only to an admin page, not to %s",
    async (returnTo) => {
      server.use(mswHttp.post("/api/auth/logout", () => problem(403)));

      const response = await logout(returnTo);

      expect(response.headers.get("Location")).toBe("/admin/projects");
    },
  );
});
