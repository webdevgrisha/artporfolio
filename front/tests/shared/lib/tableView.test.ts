import { describe, expect, it } from "vitest";

import { readTableView, writeTableView } from "@/shared/lib/tableView";

/** The columns a table sorts by. */
const columns = ["position", "title", "link"];

describe("readTableView", () => {
  it("reads the search and the sorting from the address", () => {
    expect(readTableView(new URLSearchParams("q=слон&sort=link.desc"), columns)).toEqual({
      query: "слон",
      sorting: [{ desc: true, id: "link" }],
    });
  });

  it("ignores a sorting it does not know", () => {
    for (const sort of ["photos.asc", "title.up", "title", ""]) {
      expect(readTableView(new URLSearchParams({ sort }), columns).sorting).toEqual([]);
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
