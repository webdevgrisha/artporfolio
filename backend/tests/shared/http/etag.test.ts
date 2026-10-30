import { describe, expect, it } from "vitest";

import { entityTag, matchesIfMatch } from "#shared/http/etag";

describe("entityTag", () => {
  it("is a quoted strong tag that follows the data, not the order of its keys", () => {
    const tag = entityTag([{ alt: "Sketch", id: "a" }]);

    expect(tag).toMatch(/^"[\w-]+"$/);
    expect(entityTag([{ id: "a", alt: "Sketch" }])).toBe(tag);
    expect(entityTag([{ alt: "Study", id: "a" }])).not.toBe(tag);
  });
});

describe("matchesIfMatch", () => {
  const tag = '"current"';

  it("matches the current tag, alone or in a list", () => {
    expect(matchesIfMatch(tag, tag)).toBe(true);
    expect(matchesIfMatch(`"old", ${tag}`, tag)).toBe(true);
  });

  it("matches any representation for *", () => {
    expect(matchesIfMatch(" * ", tag)).toBe(true);
  });

  it("rejects another tag, and the weak form of the current one", () => {
    expect(matchesIfMatch('"old"', tag)).toBe(false);
    expect(matchesIfMatch(`W/${tag}`, tag)).toBe(false);
  });
});
