import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import { citiesOf, countryOptions } from "@/features/edit-gallery/model/workCities";

const made = (country: string | null, city: string) => ({ city, country }) as GalleryWork;
const works = [
  made("BY", "Минск"),
  made(null, ""),
  made("PL", "Варшава"),
  made("BY", "Минск"),
  made("PL", "Краков"),
];

describe("citiesOf", () => {
  it("gives each city once, alphabetically, without the works that have none", () => {
    expect(citiesOf(works, "")).toEqual(["Варшава", "Краков", "Минск"]);
  });

  it("gives only the cities of the chosen country", () => {
    expect(citiesOf(works, "PL")).toEqual(["Варшава", "Краков"]);
    expect(citiesOf(works, "DE")).toEqual([]);
  });
});

describe("countryOptions", () => {
  it("offers no country first, then every country by its Russian name", () => {
    expect(countryOptions[0]).toEqual({ label: "Не указана", value: "" });
    expect(countryOptions).toContainEqual({ label: "Польша", value: "PL" });
    expect(countryOptions).toHaveLength(250);
  });
});
