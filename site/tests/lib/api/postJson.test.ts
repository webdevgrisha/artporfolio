import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/apiError";
import { postJson } from "@/lib/api/postJson";

function answer(status: number) {
  const fetchMock = vi.fn(async () => new Response(null, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postJson", () => {
  it("sends the body as JSON to the resource of the API", async () => {
    const fetchMock = answer(204);

    await expect(postJson("newsletter/subscribers", { email: "a@b.co" })).resolves.toBe(undefined);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.pathname).toMatch(/\/newsletter\/subscribers$/);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(init.body).toBe('{"email":"a@b.co"}');
  });

  it("rejects a refusal of the API with its status", async () => {
    answer(400);

    await expect(postJson("newsletter/subscribers", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
    });
  });

  it("rejects when the API cannot be reached, with no status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await postJson("newsletter/subscribers", {}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(undefined);
  });
});
