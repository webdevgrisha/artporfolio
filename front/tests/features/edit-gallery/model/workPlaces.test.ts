import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import { placesOf } from "@/features/edit-gallery/model/workPlaces";

const placed = (place: string) => ({ place }) as GalleryWork;

describe("placesOf", () => {
  it("gives each place once, alphabetically, without the works that have none", () => {
    expect(placesOf([placed("Минск"), placed(""), placed("Варшава"), placed("Минск")])).toEqual([
      "Варшава",
      "Минск",
    ]);
  });
});
