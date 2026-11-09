import { describe, expect, it } from "vitest";

import { readTableView, type TableFilter, writeTableView } from "@/shared/lib/tableView";

/** The columns a table sorts by. */
const columns = ["position", "title", "link"];

/** A filter of a table by its section. */
const sectionFilter: TableFilter<unknown> = {
  id: "section",
  label: "Раздел",
  matches: () => true,
  options: [{ label: "Живопись", value: "painting" }],
};

describe("readTableView", () => {
  it("reads the search and the sorting from the address", () => {
    expect(readTableView(new URLSearchParams("q=слон&sort=link.desc"), columns)).toEqual({
      filters: {},
      page: 1,
      query: "слон",
      sorting: [{ desc: true, id: "link" }],
    });
  });

  it("reads a filter from the address", () => {
    const params = new URLSearchParams("section=painting");

    expect(readTableView(params, columns, [sectionFilter]).filters).toEqual({
      section: "painting",
    });
  });

  it("ignores a value of a filter it does not know", () => {
    for (const params of ["section=deleted", "section=", ""]) {
      expect(readTableView(new URLSearchParams(params), columns, [sectionFilter]).filters).toEqual({
        section: "",
      });
    }
  });

  it("ignores a sorting it does not know", () => {
    for (const sort of ["photos.asc", "title.up", "title", ""]) {
      expect(readTableView(new URLSearchParams({ sort }), columns).sorting).toEqual([]);
    }
  });
});

describe("the page of the view", () => {
  it("reads a page from the address and takes the first for anything else", () => {
    expect(readTableView(new URLSearchParams("page=3"), columns).page).toBe(3);

    for (const page of ["0", "-1", "1.5", "abc"]) {
      expect(readTableView(new URLSearchParams({ page }), columns).page).toBe(1);
    }
  });
});

describe("writeTableView", () => {
  it("writes the view and keeps the other parameters", () => {
    const params = writeTableView(new URLSearchParams("tab=1&q=old"), {
      filters: { section: "painting" },
      page: 2,
      query: "тигр",
      sorting: [{ desc: false, id: "title" }],
    });

    expect(Object.fromEntries(params)).toEqual({
      page: "2",
      q: "тигр",
      section: "painting",
      sort: "title.asc",
      tab: "1",
    });
  });

  it("drops an empty search, no sorting and an empty filter from the address", () => {
    const params = writeTableView(new URLSearchParams("q=слон&sort=title.asc&section=painting"), {
      filters: { section: "" },
      page: 1,
      query: "",
      sorting: [],
    });

    expect(params.toString()).toBe("");
  });
});
