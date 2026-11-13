import { describe, expect, it } from "vitest";

import { projectAnchors } from "@/lib/site/projectAnchors";

const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];

describe("projectAnchors", () => {
  it("names each project by its title", () => {
    expect(
      projectAnchors([
        { id: "a", title: "Elephant" },
        { id: "b", title: "Night Tiger" },
      ]),
    ).toEqual(["elephant", "night-tiger"]);
  });

  it("names a project by its id when its title has no Latin letters", () => {
    expect(projectAnchors([{ id: ids[0] ?? "", title: "Слон" }])).toEqual([ids[0]]);
  });

  it("tells apart titles that make the same anchor, the first keeping the plain one", () => {
    expect(
      projectAnchors([
        { id: "a", title: "Tiger" },
        { id: "b", title: "Tiger!" },
        { id: "c", title: "TIGER?" },
      ]),
    ).toEqual(["tiger", "tiger-2", "tiger-3"]);
  });
});
