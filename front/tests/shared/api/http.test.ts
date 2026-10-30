import { HttpResponse, http as mswHttp } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

import { http } from "@/shared/api/http";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

import { csrfHandler, csrfToken, problem } from "../../support/handlers";
import { recordRequests, server } from "../../support/server";

const itemSchema = z.object({ name: z.string() });

beforeEach(() => {
  server.use(csrfHandler);
});

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

  it("sends an object as JSON with its headers and the CSRF token", async () => {
    let request: Request | undefined;
    server.use(
      mswHttp.post("/api/items/1", ({ request: received }) => {
        request = received.clone();
        return HttpResponse.json({ name: "Холст" });
      }),
    );

    await http.post({
      body: { name: "Холст" },
      headers: { "X-Request": "edit" },
      path: "/items/1",
      schema: itemSchema,
    });

    expect(request?.headers.get("Content-Type")).toBe("application/json");
    expect(request?.headers.get("X-Request")).toBe("edit");
    expect(request?.headers.get("X-CSRF-Token")).toBe(csrfToken);
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

  it("resolves a request without a body or content", async () => {
    server.use(
      mswHttp.post("/api/items/1/publish", ({ request }) => {
        expect(request.headers.has("Content-Type")).toBe(false);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(http.postVoid({ path: "/items/1/publish" })).resolves.toBeUndefined();
  });

  it("rejects an error response with its status", async () => {
    server.use(mswHttp.get("/api/items/1", () => problem(404)));

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

describe("http entity tags", () => {
  const etag = '"list-tag"';

  it("returns the ETag of a representation with its body", async () => {
    server.use(
      mswHttp.get("/api/items", () =>
        HttpResponse.json({ name: "Холст" }, { headers: { ETag: etag } }),
      ),
    );

    await expect(http.getWithETag({ path: "/items", schema: itemSchema })).resolves.toEqual({
      data: { name: "Холст" },
      etag,
    });
  });

  it.each(["PUT", "PATCH"] as const)(
    "sends a conditional %s with If-Match and returns the new ETag",
    async (method) => {
      let request: Request | undefined;
      const handler = method === "PUT" ? mswHttp.put : mswHttp.patch;
      server.use(
        handler("/api/items", ({ request: received }) => {
          request = received.clone();
          return HttpResponse.json({ name: "Холст" }, { headers: { ETag: '"new-tag"' } });
        }),
      );
      const send = method === "PUT" ? http.putIfMatch : http.patchIfMatch;

      const result = await send.call(http, {
        body: { name: "Холст" },
        etag,
        path: "/items",
        schema: itemSchema,
      });

      expect(request?.method).toBe(method);
      expect(request?.headers.get("Content-Type")).toBe(
        method === "PATCH" ? "application/merge-patch+json" : "application/json",
      );
      expect(request?.headers.get("If-Match")).toBe(etag);
      expect(request?.headers.get("X-CSRF-Token")).toBe(csrfToken);
      expect(result).toEqual({ data: { name: "Холст" }, etag: '"new-tag"' });
    },
  );

  it("sends a conditional deletion with If-Match and returns the new ETag", async () => {
    let request: Request | undefined;
    server.use(
      mswHttp.delete("/api/items/1", ({ request: received }) => {
        request = received;
        return new HttpResponse(null, { headers: { ETag: '"new-tag"' }, status: 204 });
      }),
    );

    const newEtag = await http.deleteIfMatch({ etag, path: "/items/1" });

    expect(request?.headers.get("If-Match")).toBe(etag);
    expect(newEtag).toBe('"new-tag"');
    expect(request?.headers.get("X-CSRF-Token")).toBe(csrfToken);
  });

  it("rejects a response without the ETag it was asked for", async () => {
    server.use(mswHttp.get("/api/untagged", () => HttpResponse.json({ name: "Холст" })));

    await expect(http.getWithETag({ path: "/untagged", schema: itemSchema })).rejects.toThrow(
      "has no ETag",
    );
  });
});

describe("http CSRF token", () => {
  /** The X-CSRF-Token header of each request to /api/items, in order. */
  function recordTokens(): (string | null)[] {
    const tokens: (string | null)[] = [];
    server.events.on("request:start", ({ request }) => {
      if (new URL(request.url).pathname.startsWith("/api/items")) {
        tokens.push(request.headers.get("X-CSRF-Token"));
      }
    });
    return tokens;
  }

  beforeEach(() => {
    server.use(
      mswHttp.get("/api/items/1", () => HttpResponse.json({ name: "Холст" })),
      mswHttp.post("/api/items/:id", () => new HttpResponse(null, { status: 204 })),
    );
  });

  it("asks for the token once and sends it with every change, not with a read", async () => {
    const requests = recordRequests();
    const tokens = recordTokens();

    await Promise.all([http.postVoid({ path: "/items/1" }), http.postVoid({ path: "/items/2" })]);
    await http.get({ path: "/items/1", schema: itemSchema });

    expect(requests.filter((request) => request === "GET /api/auth/csrf")).toHaveLength(1);
    expect(tokens).toEqual([csrfToken, csrfToken, null]);
  });

  it("sends a change made without a session without asking for a token", async () => {
    const requests = recordRequests();

    await http.postVoid({ path: "/items/1", withCsrfToken: false });

    expect(requests).toEqual(["POST /api/items/1"]);
  });

  it("sends a change once more with a new token after the session changed", async () => {
    let session = "old";
    server.use(
      mswHttp.get("/api/auth/csrf", () => HttpResponse.json({ csrfToken: `token-${session}` })),
      mswHttp.post("/api/items/1", ({ request }) =>
        request.headers.get("X-CSRF-Token") === `token-${session}`
          ? new HttpResponse(null, { status: 204 })
          : problem(403),
      ),
    );
    await http.postVoid({ path: "/items/1" });
    session = "new";
    const tokens = recordTokens();

    await expect(http.postVoid({ path: "/items/1" })).resolves.toBeUndefined();
    expect(tokens).toEqual(["token-old", "token-new"]);
  });

  it("sends a change once more at most", async () => {
    server.use(mswHttp.post("/api/items/1", () => problem(403)));
    const tokens = recordTokens();

    await expect(http.postVoid({ path: "/items/1" })).rejects.toMatchObject({ status: 403 });
    expect(tokens).toHaveLength(2);
  });

  it("asks again after the token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error(), { once: true }));

    await expect(http.postVoid({ path: "/items/1" })).rejects.toBeInstanceOf(NetworkError);
    await expect(http.postVoid({ path: "/items/1" })).resolves.toBeUndefined();
  });

  it("rejects a change with the reason the token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => problem(401)));
    const requests = recordRequests();

    await expect(http.postVoid({ path: "/items/1" })).rejects.toMatchObject({ status: 401 });
    expect(requests).toEqual(["GET /api/auth/csrf"]);
  });
});
