import { describe, expect, it } from "vitest";

import { colorsFormSchema } from "@/features/edit-gallery/lists/model/colorsFormSchema";
import { materialsList } from "@/features/edit-gallery/lists/model/materialsList";
import { palettesList } from "@/features/edit-gallery/lists/model/palettesList";
import { titleListFormSchema } from "@/features/edit-gallery/lists/model/titleList";
import { sectionFormSchema } from "@/features/edit-gallery/section/model/sectionFormSchema";
import { toTranslationValues } from "@/shared/lib/translationsForm";

/** Every language with no text yet. */
const translations = toTranslationValues({}, []);

/** Every language with no title yet. */
const sectionTranslations = toTranslationValues({}, ["title"]);

const materialsFormSchema = titleListFormSchema(materialsList);
const palettesFormSchema = titleListFormSchema(palettesList);

function row(title: string, index: number) {
  return { id: `id-${String(index)}`, title };
}

function issuesOf(result: {
  success: boolean;
  error?: { issues: { message: string; path: PropertyKey[] }[] };
}) {
  return result.success
    ? []
    : (result.error?.issues ?? []).map(({ message, path }) => ({ message, path }));
}

describe("section form", () => {
  it("trims the titles and takes a section without subsections", () => {
    expect(
      sectionFormSchema.parse({
        subsections: [],
        title: "  Графика ",
        translations: sectionTranslations,
      }),
    ).toEqual({
      subsections: [],
      title: "Графика",
      translations: sectionTranslations,
    });
  });

  it("needs a title for the section and for each subsection", () => {
    expect(
      issuesOf(
        sectionFormSchema.safeParse({
          subsections: [row(" ", 0)],
          title: "",
          translations: sectionTranslations,
        }),
      ),
    ).toEqual([
      { message: "Введите название", path: ["title"] },
      { message: "Введите название", path: ["subsections", 0, "title"] },
    ]);
  });

  it("points at a subsection title used twice, whatever the case and spaces", () => {
    const subsections = ["Театральные", " театральные "].map(row);

    expect(
      issuesOf(
        sectionFormSchema.safeParse({
          subsections,
          title: "Постеры",
          translations: sectionTranslations,
        }),
      ),
    ).toEqual([{ message: "Такой подраздел уже есть", path: ["subsections", 1, "title"] }]);
  });
});

describe("materials form", () => {
  it("takes no materials at all", () => {
    expect(materialsFormSchema.safeParse({ items: [], translations }).success).toBe(true);
  });

  it("points at a material used twice and at an empty title", () => {
    const items = ["Акварель", "", "АКВАРЕЛЬ"].map(row);

    expect(issuesOf(materialsFormSchema.safeParse({ items, translations }))).toEqual([
      { message: "Введите название", path: ["items", 1, "title"] },
      { message: "Такой материал уже есть", path: ["items", 2, "title"] },
    ]);
  });
});

describe("colors form", () => {
  function color(title: string, index: number) {
    return { ...row(title, index), hex: "#1f4e9c" };
  }

  it("points at a color used twice and at an empty title", () => {
    const colors = ["Синий", "", " синий"].map(color);

    expect(issuesOf(colorsFormSchema.safeParse({ colors, translations }))).toEqual([
      { message: "Введите название", path: ["colors", 1, "title"] },
      { message: "Такой цвет уже есть", path: ["colors", 2, "title"] },
    ]);
  });

  it("needs a swatch as #rrggbb", () => {
    const colors = [{ ...color("Синий", 0), hex: "blue" }];

    expect(issuesOf(colorsFormSchema.safeParse({ colors, translations }))).toEqual([
      { message: "Выберите цвет", path: ["colors", 0, "hex"] },
    ]);
  });
});

describe("palettes form", () => {
  it("points at a palette used twice and at an empty title", () => {
    const items = ["Пастельная", "", "пастельная "].map(row);

    expect(issuesOf(palettesFormSchema.safeParse({ items, translations }))).toEqual([
      { message: "Введите название", path: ["items", 1, "title"] },
      { message: "Такая палитра уже есть", path: ["items", 2, "title"] },
    ]);
  });

  it("takes up to 30 palettes", () => {
    const items = Array.from({ length: 31 }, (_, index) => row(String(index), index));

    expect(issuesOf(palettesFormSchema.safeParse({ items, translations }))).toEqual([
      { message: "Не больше 30 палитр", path: ["items"] },
    ]);
  });
});
