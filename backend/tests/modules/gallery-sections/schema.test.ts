import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { maxSubsections, sectionBodySchema } from "#modules/gallery-sections/schema";

function body(title: string, subsections: string[] = []) {
  return {
    title,
    subsections: subsections.map((subsection) => ({ id: randomUUID(), title: subsection })),
  };
}

function issuesOf(data: unknown): { message: string; path: PropertyKey[] }[] {
  const result = sectionBodySchema.safeParse(data);

  return result.success ? [] : result.error.issues.map(({ message, path }) => ({ message, path }));
}

describe("section body", () => {
  it("trims the titles", () => {
    const posters = body("  Постеры ", [" Театральные "]);

    expect(sectionBodySchema.parse(posters)).toEqual({
      title: "Постеры",
      subsections: [{ id: posters.subsections[0]?.id, title: "Театральные" }],
    });
  });

  it("takes a section without subsections", () => {
    expect(issuesOf(body("Графика"))).toEqual([]);
  });

  it("needs titles of up to 50 characters", () => {
    expect(issuesOf(body("  "))).toHaveLength(1);
    expect(issuesOf(body("a".repeat(50), ["a".repeat(50)]))).toEqual([]);
    expect(issuesOf(body("a".repeat(51)))).toHaveLength(1);
    expect(issuesOf(body("Постеры", [""]))).toHaveLength(1);
    expect(issuesOf(body("Постеры", ["a".repeat(51)]))).toHaveLength(1);
  });

  it("needs a uuid for each subsection, used once", () => {
    const posters = body("Постеры", ["Рекламные", "Театральные"]);
    const [first, second] = posters.subsections;

    expect(issuesOf({ ...posters, subsections: [{ ...first, id: "ads" }] })).toHaveLength(1);
    expect(issuesOf({ ...posters, subsections: [first, { ...second, id: first?.id }] })).toEqual([
      { message: "Each id must appear once", path: ["subsections", 1, "id"] },
    ]);
  });

  it("points at a subsection title used twice, whatever the case", () => {
    expect(issuesOf(body("Постеры", ["Театральные", "ТЕАТРАЛЬНЫЕ"]))).toEqual([
      { message: "Another subsection has this title", path: ["subsections", 1, "title"] },
    ]);
  });

  it(`takes up to ${maxSubsections} subsections`, () => {
    const titles = Array.from({ length: maxSubsections }, (_, index) => `${index}`);

    expect(issuesOf(body("Постеры", titles))).toEqual([]);
    expect(issuesOf(body("Постеры", [...titles, "ещё"]))).toHaveLength(1);
  });

  it("rejects nested subsections and unknown fields", () => {
    const posters = body("Постеры", ["Театральные"]);

    expect(
      issuesOf({ ...posters, subsections: [{ ...posters.subsections[0], subsections: [] }] }),
    ).toHaveLength(1);
    expect(issuesOf({ ...posters, cover: "" })).toHaveLength(1);
  });
});
