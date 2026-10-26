import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { http } from "@/http/http";
import { HttpError } from "@/http/httpError";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("http", () => {
  it("sends credentials and parses the response with the schema", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: "ok", extra: true }));

    await expect(
      http.get({ path: "/test", schema: z.object({ value: z.string() }) }),
    ).resolves.toEqual({ value: "ok" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("serializes a JSON body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await http.postVoid({ path: "/test", body: { name: "value" } });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.body).toBe(JSON.stringify({ name: "value" }));
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("throws HttpError with the status and API error code", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "FORBIDDEN", message: "Access denied" } }, 403),
    );

    const error = await http.postVoid({ path: "/test" }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("throws HttpError without a code when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    const error = await http.postVoid({ path: "/test" }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: undefined, status: 502 });
  });

  it("notifies the unauthorized handler on 401", async () => {
    const handler = vi.fn();
    const unsubscribe = http.onUnauthorized(handler);
    fetchMock.mockResolvedValue(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401));

    await expect(http.postVoid({ path: "/test" })).rejects.toBeInstanceOf(HttpError);
    expect(handler).toHaveBeenCalledOnce();

    unsubscribe();
  });
});
