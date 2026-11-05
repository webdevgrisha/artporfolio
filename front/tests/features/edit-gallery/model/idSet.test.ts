import { describe, expect, it } from "vitest";

import { toIdSet } from "@/features/edit-gallery/model/idSet";

describe("toIdSet", () => {
  it("gives the same ids in one order, whatever the order of the choices", () => {
    expect(toIdSet(["oil", "canvas"])).toEqual(toIdSet(["canvas", "oil"]));
  });

  it("drops repeated ids", () => {
    expect(toIdSet(["oil", "oil"])).toEqual(["oil"]);
  });
});
