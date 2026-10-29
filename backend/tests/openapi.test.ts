import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { renderOpenApiDocument } from "../openapi/document.ts";

describe("OpenAPI document", () => {
  it("matches the committed openapi.yaml; run `pnpm openapi` after changing the API", async () => {
    const committed = await readFile(new URL("../openapi/openapi.yaml", import.meta.url), "utf8");

    expect(renderOpenApiDocument()).toBe(committed);
  });
});
