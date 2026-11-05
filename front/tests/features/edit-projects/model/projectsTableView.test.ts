import { describe, expect, it } from "vitest";

import { linkHost, matchesQuery } from "@/features/edit-projects/model/projectsTableView";

const elephant = {
  createdAt: "2026-01-15T10:00:00.000Z",
  description: "",
  id: "elephant",
  link: "https://www.elephant.com/book",
  photos: [],
  title: "Слон",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

describe("matchesQuery", () => {
  it("finds a project by its title or its link, in any case", () => {
    expect(matchesQuery(elephant, "СЛО")).toBe(true);
    expect(matchesQuery(elephant, "elephant.com")).toBe(true);
    expect(matchesQuery(elephant, "  ")).toBe(true);
    expect(matchesQuery(elephant, "тигр")).toBe(false);
  });
});

describe("linkHost", () => {
  it("shows the host of a link without www", () => {
    expect(linkHost("https://www.elephant.com/book")).toBe("elephant.com");
    expect(linkHost("not a link")).toBe("not a link");
  });
});
