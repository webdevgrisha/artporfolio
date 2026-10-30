import { describe, expect, it } from "vitest";

import {
  linkHost,
  matchesQuery,
  readTableView,
  writeTableView,
} from "@/features/edit-projects/model/projectsTableView";

const elephant = {
  description: "",
  id: "elephant",
  link: "https://www.elephant.com/book",
  photos: [],
  title: "Слон",
};

describe("readTableView", () => {
  it("reads the search and the sorting from the address", () => {
    expect(readTableView(new URLSearchParams("q=слон&sort=link.desc"))).toEqual({
      query: "слон",
      sorting: [{ desc: true, id: "link" }],
    });
  });

  it("ignores a sorting it does not know", () => {
    for (const sort of ["photos.asc", "title.up", "title", ""]) {
      expect(readTableView(new URLSearchParams({ sort })).sorting).toEqual([]);
    }
  });
});

describe("writeTableView", () => {
  it("writes the view and keeps the other parameters", () => {
    const params = writeTableView(new URLSearchParams("tab=1&q=old"), {
      query: "тигр",
      sorting: [{ desc: false, id: "title" }],
    });

    expect(Object.fromEntries(params)).toEqual({ q: "тигр", sort: "title.asc", tab: "1" });
  });

  it("drops an empty search and no sorting from the address", () => {
    const params = writeTableView(new URLSearchParams("q=слон&sort=title.asc"), {
      query: "",
      sorting: [],
    });

    expect(params.toString()).toBe("");
  });
});

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
