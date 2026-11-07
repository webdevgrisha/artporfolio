import { describe, expect, it } from "vitest";

import * as aboutPhotos from "#modules/about/process-photos/schema";
import * as currencyRates from "#modules/currencies/schema";
import { suggestedPrice } from "#modules/currencies/suggested-price";
import * as collections from "#modules/gallery/collections/schema";
import * as colors from "#modules/gallery/colors/schema";
import * as materials from "#modules/gallery/materials/schema";
import * as palettes from "#modules/gallery/palettes/schema";
import * as sections from "#modules/gallery/sections/schema";
import { discountedAmount } from "#modules/gallery/works/prices";
import * as works from "#modules/gallery/works/schema";
import * as pages from "#modules/pages/schema";
import * as projects from "#modules/projects/schema";
import * as languages from "#shared/i18n/languages";
import { maxSourceFileSize } from "#shared/images/processing";

type Module = Record<string, unknown>;

/**
 * A module of the front, whose forms repeat the rules of the API to answer before a request is
 * sent. The path is built at run time, so the type check of the backend stays out of the front.
 */
function front(path: string): Promise<Module> {
  return import(/* @vite-ignore */ `@/${path}.ts`);
}

const sameNames: [string, Module, string[]][] = [
  ["entities/about/model/processPhoto", aboutPhotos, ["maxProcessPhotos"]],
  ["shared/config/languages", languages, ["targetLanguages"]],
  ["entities/currency/model/currencyRates", currencyRates, ["currencies", "maxCurrencyRate"]],
  ["entities/gallery/model/galleryCollection", collections, ["maxCollectionWorks"]],
  ["entities/gallery/model/galleryColors", colors, ["maxColors"]],
  ["entities/gallery/model/galleryMaterials", materials, ["maxMaterials"]],
  ["entities/gallery/model/galleryPalettes", palettes, ["maxPalettes"]],
  ["entities/gallery/model/gallerySection", sections, ["maxSubsections"]],
  [
    "entities/gallery/model/galleryWork",
    works,
    [
      "maxWorkCityLength",
      "maxWorkColors",
      "maxWorkDiscount",
      "maxWorkMaterials",
      "maxWorkPalettes",
      "maxWorkPrice",
      "maxWorkProcessPhotos",
      "maxWorkSections",
      "maxWorkSetSize",
      "maxWorkSide",
      "minWorkDiscount",
      "minWorkSetSize",
      "minWorkYear",
      "workCurrencies",
      "workFormats",
      "workSaleStatuses",
    ],
  ],
  ["entities/project/model/project", projects, ["maxProjectPhotos"]],
];

describe("the rules the front repeats", () => {
  it.each(sameNames)("%s has the values of the API", async (path, api, names) => {
    const repeated = await front(path);

    for (const name of names) {
      expect(repeated[name], name).toEqual(api[name]);
    }
  });

  it("names the pages of the API", async () => {
    const { sitePageIds } = await front("entities/site-page/model/sitePage");

    expect(sitePageIds).toEqual(pages.pageIds);
  });

  it("limits an upload as the API does", async () => {
    const { imageUploadRules } = await front("shared/api/image");

    expect(imageUploadRules).toMatchObject({ maxFileSize: maxSourceFileSize });
  });

  it("computes a price in another currency as the API does", async () => {
    const repeated = await front("entities/currency/model/suggestedPrice");
    const frontPrice = repeated.suggestedPrice as typeof suggestedPrice;

    for (const amount of [1, 7, 99, 430, 500, 1_500, 12_345, 99_999_999]) {
      for (const rate of [0.0001, 0.7423, 0.9, 1, 3.9097, 92.5, 1_000_000]) {
        expect(frontPrice(amount, rate), `${amount} × ${rate}`).toBe(suggestedPrice(amount, rate));
      }
    }
  });

  it("takes off a discount as the API does", async () => {
    const repeated = await front("features/edit-gallery/work/model/workPriceAmount");
    const frontAmount = repeated.discountedAmount as typeof discountedAmount;

    for (const amount of [1, 3, 99, 500, 1_555]) {
      for (const percent of [null, 1, 15, 33, 50, 99]) {
        expect(frontAmount(amount, percent)).toBe(discountedAmount(amount, percent));
      }
    }
  });
});
