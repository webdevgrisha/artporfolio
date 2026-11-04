import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import {
  emptyWorkFormValues,
  formatWorkDate,
  formatWorkFormat,
  formatWorkSize,
  monthOptions,
  toPartCount,
  toWorkFormValues,
  toWorkSize,
  workFormSchema,
} from "@/features/edit-gallery/model/workFormSchema";
import {
  discountedAmount,
  formatPrice,
  toWorkPrice,
} from "@/features/edit-gallery/model/workPrice";

import { fieldErrors } from "../../../support/schema";

const work = {
  ...emptyWorkFormValues,
  description: "Масло, холст.",
  height: "70",
  month: "3",
  photo: new File([""], "elephant.png"),
  sectionIds: ["section-1"],
  materialIds: ["material-1"],
  colorIds: ["color-1"],
  paletteIds: ["palette-1"],
  photoAlt: "Слон на закате",
  title: "Слон",
  width: "50",
  year: "2024",
};

/** A saved work, with only the fields the form reads. */
const savedWork = {
  description: "",
  month: 3,
  country: "PL",
  city: "Варшава",
  photo: { alt: "Стрекоза" },
  processPhotos: [],
  sectionIds: [],
  materialIds: [],
  colorIds: [],
  paletteIds: [],
  format: "set",
  partCount: 12,
  price: null,
  size: { height: 27.9, width: 21.6 },
  title: "Стрекоза",
  year: 2025,
} as unknown as GalleryWork;

describe("workFormSchema", () => {
  it("needs every field but the process photos", () => {
    expect(fieldErrors(workFormSchema, work)).toEqual({});
    expect(fieldErrors(workFormSchema, emptyWorkFormValues)).toEqual({
      description: ["Введите описание"],
      height: ["Введите размер"],
      colorIds: ["Выберите хотя бы один цвет"],
      materialIds: ["Выберите хотя бы один материал"],
      month: ["Выберите месяц"],
      paletteIds: ["Выберите хотя бы одну палитру"],
      photo: ["Выберите фото"],
      sectionIds: ["Выберите хотя бы один раздел"],
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

  it("takes this month, but not a month to come", () => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = now.getMonth() + 1;

    expect(fieldErrors(workFormSchema, { ...work, month: String(month), year })).toEqual({});

    if (month < 12) {
      expect(fieldErrors(workFormSchema, { ...work, month: String(month + 1), year })).toEqual({
        month: ["Этот месяц ещё не наступил"],
      });
    }
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

describe("the materials in the form", () => {
  it("takes up to ten materials", () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => `m${String(index)}`);

    expect(fieldErrors(workFormSchema, { ...work, materialIds: ids(10) })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, materialIds: ids(11) })).toEqual({
      materialIds: ["Не больше 10 материалов"],
    });
  });
});

describe("the colors in the form", () => {
  it("takes up to ten colors", () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => `c${String(index)}`);

    expect(fieldErrors(workFormSchema, { ...work, colorIds: ids(10) })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, colorIds: ids(11) })).toEqual({
      colorIds: ["Не больше 10 цветов"],
    });
  });
});

describe("the palettes in the form", () => {
  it("takes up to five palettes", () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => `p${String(index)}`);

    expect(fieldErrors(workFormSchema, { ...work, paletteIds: ids(5) })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, paletteIds: ids(6) })).toEqual({
      paletteIds: ["Не больше 5 палитр"],
    });
  });
});

describe("the format in the form", () => {
  it("needs the count of works of a set, a whole number from 2 to 100", () => {
    const set = { ...work, format: "set" as const };

    expect(fieldErrors(workFormSchema, { ...set, partCount: " 12 " })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...set, partCount: "" })).toEqual({
      partCount: ["Введите количество"],
    });
    expect(fieldErrors(workFormSchema, { ...set, partCount: "2,5" })).toEqual({
      partCount: ["Введите целое число"],
    });
    expect(fieldErrors(workFormSchema, { ...set, partCount: "1" })).toEqual({
      partCount: ["От 2 до 100"],
    });
    expect(fieldErrors(workFormSchema, { ...set, partCount: "101" })).toEqual({
      partCount: ["От 2 до 100"],
    });
  });

  it("ignores a count left from a set once another format is chosen", () => {
    const diptych = { ...work, format: "diptych" as const, partCount: "abc" };

    expect(fieldErrors(workFormSchema, diptych)).toEqual({});
    expect(toPartCount(diptych)).toBeNull();
    expect(toPartCount({ ...work, format: "set", partCount: " 12 " })).toBe(12);
  });

  it("shows the format beside the size, nothing for a single work", () => {
    expect(formatWorkFormat({ format: "single", partCount: null })).toBeNull();
    expect(formatWorkFormat({ format: "diptych", partCount: null })).toBe("диптих");
    expect(formatWorkFormat({ format: "triptych", partCount: null })).toBe("триптих");
    expect(formatWorkFormat({ format: "set", partCount: 12 })).toBe("12 шт.");
  });
});

describe("the place in the form", () => {
  it("takes no city, or a city up to 100 characters", () => {
    expect(fieldErrors(workFormSchema, { ...work, city: "" })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, city: "а".repeat(100) })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, city: "а".repeat(101) })).toEqual({
      city: ["Не длиннее 100 символов"],
    });
  });

  it("shows the saved country and city, and no country as none chosen", () => {
    expect(toWorkFormValues(savedWork)).toMatchObject({ city: "Варшава", country: "PL" });
    expect(toWorkFormValues({ ...savedWork, country: null }).country).toBe("");
  });
});

describe("the price in the form", () => {
  it("takes a work without a price or a discount", () => {
    expect(fieldErrors(workFormSchema, { ...work, price: "", discountPercent: "" })).toEqual({});
    expect(toWorkPrice({ price: " ", discountPercent: "" })).toBeNull();
  });

  it("takes a price in whole dollars, split into thousands or not", () => {
    expect(fieldErrors(workFormSchema, { ...work, price: "1500" })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, price: "1 500" })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...work, price: "1\u00a0500" })).toEqual({});
    expect(toWorkPrice({ price: "1 500", discountPercent: "" })).toEqual({
      amount: 1500,
      currency: "USD",
      discountPercent: null,
    });
  });

  it("needs a whole price above zero and within the limit", () => {
    expect(fieldErrors(workFormSchema, { ...work, price: "499,99" })).toEqual({
      price: ["Введите целое число, например 1 500"],
    });
    expect(fieldErrors(workFormSchema, { ...work, price: "0" })).toEqual({
      price: ["Цена больше нуля"],
    });
    expect(fieldErrors(workFormSchema, { ...work, price: "100000001" })).toEqual({
      price: [`Не больше ${(100_000_000).toLocaleString("ru")}`],
    });
  });

  it("takes a discount of a whole percent from 1 to 99, only with a price", () => {
    const priced = { ...work, price: "500" };

    expect(fieldErrors(workFormSchema, { ...priced, discountPercent: "10" })).toEqual({});
    expect(fieldErrors(workFormSchema, { ...priced, discountPercent: "0" })).toEqual({
      discountPercent: ["От 1 до 99"],
    });
    expect(fieldErrors(workFormSchema, { ...priced, discountPercent: "100" })).toEqual({
      discountPercent: ["От 1 до 99"],
    });
    expect(fieldErrors(workFormSchema, { ...priced, discountPercent: "12,5" })).toEqual({
      discountPercent: ["Введите целое число"],
    });
    expect(fieldErrors(workFormSchema, { ...work, discountPercent: "10" })).toEqual({
      discountPercent: ["Сначала укажите цену"],
    });
  });

  it("shows a saved price and discount and reads them back", () => {
    const values = toWorkFormValues({
      ...savedWork,
      price: { amount: 1500, currency: "USD", discountPercent: 10, finalAmount: 1350 },
    });

    expect(values).toMatchObject({ discountPercent: "10", price: "1500" });
    expect(toWorkPrice(values)).toEqual({ amount: 1500, currency: "USD", discountPercent: 10 });
  });

  it("computes the price after the discount as the server does, in whole dollars", () => {
    expect(discountedAmount(500, null)).toBe(500);
    expect(discountedAmount(500, 10)).toBe(450);
    // 999 × 0.85 = 849.15
    expect(discountedAmount(999, 15)).toBe(849);
  });

  it("shows a price in dollars, split into thousands", () => {
    expect(formatPrice(1500, "USD").replace(/\s/g, " ")).toBe("1 500 $");
  });
});

describe("the size in the form", () => {
  it("shows a saved size with a comma and reads it back as numbers", () => {
    const values = toWorkFormValues(savedWork);

    expect(values).toMatchObject({
      format: "set",
      height: "27,9",
      partCount: "12",
      width: "21,6",
      year: "2025",
    });
    expect(toWorkSize(values)).toEqual({ height: 27.9, width: 21.6 });
  });
});

describe("formatWorkSize", () => {
  it("shows the width first, in centimetres with a comma", () => {
    expect(formatWorkSize({ height: 42, width: 29.7 })).toBe("29,7 × 42 см");
  });
});

describe("the date of a work", () => {
  it("names the months for the list and the table", () => {
    expect(monthOptions[0]).toEqual({ label: "Январь", value: "1" });
    expect(monthOptions[11]).toEqual({ label: "Декабрь", value: "12" });
    expect(formatWorkDate({ month: 3, year: 2024 })).toBe("март 2024");
  });
});
