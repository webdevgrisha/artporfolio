import { describe, expect, it } from "vitest";

import { newProjectSlug } from "#modules/projects/slug";

const none = new Set<string>();

describe("newProjectSlug", () => {
  it("writes a Russian title in Latin letters, its words joined by hyphens", () => {
    expect(newProjectSlug("Ёжик в тумане", none)).toBe("yozhik-v-tumane");
  });

  it("leaves out punctuation and keeps digits", () => {
    expect(newProjectSlug("Щука — 2024!", none)).toBe("schuka-2024");
  });

  it("cuts a long title to 60 characters, without a hyphen at the end", () => {
    const slug = newProjectSlug("Очень длинное название проекта ".repeat(4), none);

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug).not.toMatch(/-$/u);
    expect(slug.startsWith("ochen-dlinnoe-nazvanie-proekta-")).toBe(true);
  });

  it("names a project «project» when its title has no letters or digits", () => {
    expect(newProjectSlug("🦋", none)).toBe("project");
  });

  it("numbers a slug taken, from 2, to the first free number", () => {
    expect(newProjectSlug("Слон", new Set(["slon"]))).toBe("slon-2");
    expect(newProjectSlug("Слон", new Set(["slon", "slon-2"]))).toBe("slon-3");
  });
});
