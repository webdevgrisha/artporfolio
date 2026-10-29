import { HttpResponse, http as mswHttp } from "msw/http";
import { describe, expect, it } from "vitest";

import { requireSession } from "@/entities/user";
import { HttpError } from "@/shared/api/httpError";

import { problem } from "../../../support/handlers";
import { routeArgs, thrownResponse } from "../../../support/router";
import { server } from "../../../support/server";

const user = { email: "admin@example.com", uid: "admin-uid" };

describe("requireSession", () => {
  it("returns the signed-in user", async () => {
    server.use(mswHttp.get("/api/auth/me", () => HttpResponse.json({ user })));

    await expect(requireSession(routeArgs("/admin/about"))).resolves.toEqual(user);
  });

  it("sends a request without a session to the login page, which brings it back", async () => {
    server.use(mswHttp.get("/api/auth/me", () => problem(401)));

    const response = await thrownResponse(requireSession(routeArgs("/admin/about?tab=photo")));

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/admin/login?redirectTo=%2Fadmin%2Fabout%3Ftab%3Dphoto",
    );
  });

  it("fails the page for any other error: signing in again would not help", async () => {
    server.use(mswHttp.get("/api/auth/me", () => problem(503)));

    await expect(requireSession(routeArgs("/admin/about"))).rejects.toEqual(new HttpError(503));
  });
});
