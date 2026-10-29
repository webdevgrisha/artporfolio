import { HttpResponse, http as mswHttp } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

import { http } from "@/shared/api/http";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

import { server } from "../../support/server";

const itemSchema = z.object({ name: z.string() });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("http", () => {
  it("sends the request under /api with the cookies and returns the parsed body", async () => {
    // The interceptor does not pass the credentials mode on to the request it gives the handler.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    server.use(
      mswHttp.get("/api/items/1", () => HttpResponse.json({ extra: true, name: "Холст" })),
    );

    await expect(http.get({ path: "/items/1", schema: itemSchema })).resolves.toEqual({
      name: "Холст",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/items/1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sends an object as JSON with its headers", async () => {
    let request: Request | undefined;
    server.use(
      mswHttp.put("/api/items/1", ({ request: received }) => {
        request = received.clone();
        return HttpResponse.json({ name: "Холст" });
      }),
    );

    await http.put({
      body: { name: "Холст" },
      headers: { "X-CSRF-Token": "token" },
      path: "/items/1",
      schema: itemSchema,
    });

    expect(request?.headers.get("Content-Type")).toBe("application/json");
    expect(request?.headers.get("X-CSRF-Token")).toBe("token");
    await expect(request?.json()).resolves.toEqual({ name: "Холст" });
  });

  it("sends FormData as multipart with the boundary set by the browser", async () => {
    let request: Request | undefined;
    server.use(
      mswHttp.post("/api/items", ({ request: received }) => {
        request = received.clone();
        return HttpResponse.json({ name: "Холст" });
      }),
    );
    const body = new FormData();
    body.set("alt", "Портрет");
    body.set("file", new File(["photo"], "photo.png", { type: "image/png" }));

    await http.post({ body, path: "/items", schema: itemSchema });

    expect(request?.headers.get("Content-Type")).toMatch(/^multipart\/form-data; boundary=/);
    const formData = await request?.formData();
    expect(formData?.get("alt")).toBe("Портрет");
    expect(formData?.get("file")).toBeInstanceOf(File);
  });

  it("sends a PATCH as JSON", async () => {
    let body: unknown;
    server.use(
      mswHttp.patch("/api/items/1", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ name: "Холст" });
      }),
    );

    await http.patch({ body: { name: "Холст" }, path: "/items/1", schema: itemSchema });

    expect(body).toEqual({ name: "Холст" });
  });

  it("resolves a request without a body or content", async () => {
    server.use(
      mswHttp.post("/api/items/1/publish", ({ request }) => {
        expect(request.headers.has("Content-Type")).toBe(false);
        return new HttpResponse(null, { status: 204 });
      }),
      mswHttp.delete("/api/items/1", () => new HttpResponse(null, { status: 204 })),
    );

    await expect(http.postVoid({ path: "/items/1/publish" })).resolves.toBeUndefined();
    await expect(http.delete({ path: "/items/1" })).resolves.toBeUndefined();
  });

  it("rejects an error response with its status", async () => {
    server.use(
      mswHttp.get("/api/items/1", () =>
        HttpResponse.json(
          { status: 404, title: "Not Found", type: "about:blank" },
          { headers: { "Content-Type": "application/problem+json" }, status: 404 },
        ),
      ),
    );

    const request = http.get({ path: "/items/1", schema: itemSchema });

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a request that got no response as a network error", async () => {
    server.use(mswHttp.get("/api/items/1", () => HttpResponse.error()));

    await expect(http.get({ path: "/items/1", schema: itemSchema })).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it("rejects a cancelled request with the abort error, not a network error", async () => {
    server.use(mswHttp.get("/api/items/1", () => HttpResponse.json({ name: "Холст" })));
    const controller = new AbortController();
    controller.abort();

    await expect(
      http.get({ path: "/items/1", schema: itemSchema, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects a response that does not match the schema", async () => {
    server.use(mswHttp.get("/api/items/1", () => HttpResponse.json({ name: 1 })));

    await expect(http.get({ path: "/items/1", schema: itemSchema })).rejects.toBeInstanceOf(
      ZodError,
    );
  });
});
