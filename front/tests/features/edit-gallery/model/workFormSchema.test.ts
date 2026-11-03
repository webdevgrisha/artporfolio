import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import {
  emptyWorkFormValues,
  formatWorkSize,
  toWorkFormValues,
  toWorkSize,
  workFormSchema,
} from "@/features/edit-gallery/model/workFormSchema";

import { fieldErrors } from "../../../support/schema";

const work = {
  ...emptyWorkFormValues,
  description: "Масло, холст.",
  height: "70",
  photo: new File([""], "elephant.png"),
  photoAlt: "Слон на закате",
  title: "Слон",
  width: "50",
  year: "2024",
};

describe("workFormSchema", () => {
  it("needs a title, a description, a size, a year and a photo", () => {
    expect(fieldErrors(workFormSchema, work)).toEqual({});
    expect(fieldErrors(workFormSchema, emptyWorkFormValues)).toEqual({
      description: ["Введите описание"],
      height: ["Введите размер"],
      photo: ["Выберите фото"],
      title: ["Введите название"],
      width: ["Введите размер"],
      year: ["Введите год"],
    });
  });

  it("takes sides with up to two decimals, after a comma or a point", () => {
    expect(fieldErrors(workFormSchema, { ...work, width: "29,7", height: "8.5" })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, width: "29,755", height: "abc" })).toEqual({
      height: ["Введите число, например 29,7"],
      width: ["Введите число, например 29,7"],
    });
  });

  it("needs sides above zero and within the limit", () => {
    expect(fieldErrors(workFormSchema, { ...work, width: "0", height: "10001" })).toEqual({
      height: [`Не больше ${(10_000).toLocaleString("ru")}`],
      width: ["Размер больше нуля"],
    });
  });

  it("takes a year from 1900 up to this year", () => {
    const thisYear = new Date().getFullYear();

    expect(fieldErrors(workFormSchema, { ...work, year: String(thisYear) })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, year: "1899" })).toEqual({
      year: ["Не раньше 1900"],
    });
    expect(fieldErrors(workFormSchema, { ...work, year: String(thisYear + 1) })).toEqual({
      year: ["Год ещё не наступил"],
    });
    expect(fieldErrors(workFormSchema, { ...work, year: "24" })).toEqual({
      year: ["Введите год четырьмя цифрами"],
    });
  });

  it("takes up to 20 process photos, each with its description", () => {
    const row = () => ({
      alt: "Набросок",
      file: new File([""], "sketch.png"),
      status: "new" as const,
    });

    expect(
      fieldErrors(workFormSchema, { ...work, photos: Array.from({ length: 20 }, row) }),
    ).toEqual({});
    expect(
      fieldErrors(workFormSchema, { ...work, photos: Array.from({ length: 21 }, row) }),
    ).toEqual({ photos: ["Не больше 20 фото"] });
    expect(fieldErrors(workFormSchema, { ...work, photos: [{ ...row(), alt: "" }] })).toEqual({
      "photos.0.alt": ["Опишите, что на фото"],
    });
  });

  it("limits the texts", () => {
    expect(
      fieldErrors(workFormSchema, {
        ...work,
        description: "a".repeat(2_001),
        title: "a".repeat(101),
      }),
    ).toEqual({
      description: ["Не длиннее 2000 символов"],
      title: ["Не длиннее 100 символов"],
    });
  });
});

describe("the size in the form", () => {
  it("shows a saved size with a comma and reads it back as numbers", () => {
    const saved = {
      description: "",
      photo: { alt: "Стрекоза" },
      processPhotos: [],
      size: { height: 27.9, width: 21.6 },
      title: "Стрекоза",
      year: 2025,
    } as unknown as GalleryWork;
    const values = toWorkFormValues(saved);

    expect(values).toMatchObject({ height: "27,9", width: "21,6", year: "2025" });
    expect(toWorkSize(values)).toEqual({ height: 27.9, width: 21.6 });
  });
});

describe("formatWorkSize", () => {
  it("shows the width first, in centimetres with a comma", () => {
    expect(formatWorkSize({ height: 42, width: 29.7 })).toBe("29,7 × 42 см");
  });
});
