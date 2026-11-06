import { describe, expect, it } from "vitest";

import type { GalleryCollection } from "@/entities/gallery";
import {
  collectionFormSchema,
  emptyCollectionFormValues,
  toCollectionFormValues,
} from "@/features/edit-gallery/collection/model/collectionFormSchema";

import { fieldErrors } from "../../../../support/schema";

const thisYear = new Date().getFullYear();

const collection = {
  ...emptyCollectionFormValues,
  description: "Серия о животных.",
  photo: new File([""], "savanna.png"),
  photoAlt: "Саванна на закате",
  startYear: "2022",
  title: "Саванна",
};

describe("collectionFormSchema", () => {
  it("needs the title, the description, the start year and the cover; works are optional", () => {
    expect(fieldErrors(collectionFormSchema, collection)).toEqual({});
    expect(fieldErrors(collectionFormSchema, emptyCollectionFormValues)).toEqual({
      description: ["Введите описание"],
      photo: ["Выберите фото"],
      startYear: ["Введите год"],
      title: ["Введите название"],
    });
  });

  it("takes no end year, or one after the start up to this year", () => {
    expect(fieldErrors(collectionFormSchema, { ...collection, endYear: "  " })).toEqual({});
    expect(fieldErrors(collectionFormSchema, { ...collection, endYear: "2025" })).toEqual({});
    expect(fieldErrors(collectionFormSchema, { ...collection, endYear: "2022" })).toEqual({
      endYear: ["Позже года начала. Для одного года оставьте поле пустым"],
    });
    expect(
      fieldErrors(collectionFormSchema, { ...collection, endYear: String(thisYear + 1) }),
    ).toEqual({ endYear: ["Год ещё не наступил"] });
    expect(fieldErrors(collectionFormSchema, { ...collection, endYear: "25" })).toEqual({
      endYear: ["Введите год четырьмя цифрами"],
    });
  });

  it("compares the years only once the start year is valid", () => {
    expect(
      fieldErrors(collectionFormSchema, { ...collection, endYear: "2020", startYear: "20" }),
    ).toEqual({ startYear: ["Введите год четырьмя цифрами"] });
  });
});

describe("toCollectionFormValues", () => {
  it("leaves the end year empty for a collection of one year", () => {
    const saved = {
      cover: { alt: "Саванна" },
      description: "Серия.",
      endYear: null,
      startYear: 2024,
      title: "Саванна",
      translations: {},
      workIds: ["work-1"],
    } as unknown as GalleryCollection;

    expect(toCollectionFormValues(saved)).toMatchObject({
      endYear: "",
      photoAlt: "Саванна",
      startYear: "2024",
      workIds: ["work-1"],
    });
    expect(toCollectionFormValues({ ...saved, endYear: 2025 }).endYear).toBe("2025");
  });
});
