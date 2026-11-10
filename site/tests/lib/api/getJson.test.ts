import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, isNotFound } from "@/lib/api/apiError";
import { getJson } from "@/lib/api/getJson";

const schema = z.object({ title: z.string() });

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getJson", () => {
  it("reads a resource of the API in the language of the page", async () => {
    const fetchMock = answer({ title: "O mnie" });

    await expect(getJson("about", schema, { language: "pl" })).resolves.toEqual({
      title: "O mnie",
    });
    const url = new URL(String(fetchMock.mock.calls[0]?.at(0)));
    expect(url.pathname).toMatch(/\/about$/);
    expect(url.searchParams.get("lang")).toBe("pl");
  });

  it("tells a missing resource apart, so the page becomes a 404", async () => {
    answer({ title: "Not Found" }, 404);

    const error = await getJson("projects/missing", schema, { language: "en" }).catch(
      (caught: unknown) => caught,
    );

    expect(isNotFound(error)).toBe(true);
  });

  it("rejects an error of the server with its status", async () => {
    answer({}, 503);

    await expect(getJson("about", schema, { language: "en" })).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
    });
  });

  it("rejects an answer of another shape than the page relies on", async () => {
    answer({ title: 42 });

    await expect(getJson("about", schema, { language: "en" })).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects when the API cannot be reached, with no status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    await expect(getJson("about", schema, { language: "en" })).rejects.toMatchObject({
      status: undefined,
    });
  });
});
