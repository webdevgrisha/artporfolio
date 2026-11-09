import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { discountedAmount } from "#modules/currencies/discounted-amount";
import { latestToday } from "#shared/dates/latest-today";
import { countryCodes } from "#shared/geo/countries";
import { type Photo, photoBodySchema, storedPhotoSchema } from "#shared/images/photo";
import {
  type ListPhoto,
  photoListBodySchema,
  storedListPhotoSchema,
} from "#shared/images/photo-list";

/** The earliest year a work can be dated. */
export const minWorkYear = 1900;

/** The most sections and subsections one work may be in. */
export const maxWorkSections = 30;

/** The most materials one work may be made of. */
export const maxWorkMaterials = 10;

/** The most colors one work may have. */
export const maxWorkColors = 10;

/** The most palettes one work may have. */
export const maxWorkPalettes = 5;

/** The most process photos one work may have; raise it when the artist needs more. */
export const maxWorkProcessPhotos = 20;

/** How many works a set may have: a set of one is a single work, two or three a diptych or triptych. */
export const minWorkSetSize = 2;
export const maxWorkSetSize = 100;

/**
 * What the work is made up of: one work, a diptych or triptych (one work of two or three panels), or
 * a set of separate works, most often prints of an original, which says how many it has.
 */
export const workFormats = ["single", "diptych", "triptych", "set"] as const;

/** The longest name of the city a work was made in. */
export const maxWorkCityLength = 100;

/**
 * Whether a visitor can buy the work: it is for sale, reserved for a buyer who has not paid yet,
 * sold, or not for sale at all, such as one the artist keeps. Apart from the price: a sold work
 * keeps the price it was sold for, and a work for sale without a price is sold on request.
 */
export const workSaleStatuses = ["available", "reserved", "sold", "notForSale"] as const;

/** The only currency a price is set in for now; the site will show other currencies converted. */
export const workCurrencies = ["USD"] as const;

/** The highest price in whole units of its currency: well above any work, low enough to catch a typo. */
export const maxWorkPrice = 100_000_000;

/** A discount takes off a whole percent of the price: at least 1, and never the whole price. */
export const minWorkDiscount = 1;
export const maxWorkDiscount = 99;

/** The largest side in centimetres: well above any painting, low enough to catch a typo. */
export const maxWorkSide = 10_000;

const workIdSchema = z.uuid();

/** The path parameters of a request about one work. */
export const workParamsSchema = z.object({
  id: workIdSchema,
});

/** A side of a work in centimetres, with at most two decimals, such as 29.7. */
const workSideSchema = z.number().positive().max(maxWorkSide).multipleOf(0.01);

/** The size of a work in centimetres, the only unit stored; the API adds the size in inches. */
const workSizeSchema = z.strictObject({
  width: workSideSchema,
  height: workSideSchema,
});

/**
 * What the work costs, in whole units of the currency (dollars, without cents), and the percent
 * taken off it, if any. The price after the discount is not sent: the API computes it, and it is
 * never 0, which would make the work free.
 */
const workPriceBodySchema = z
  .strictObject({
    amount: z.number().int().min(1).max(maxWorkPrice),
    currency: z.enum(workCurrencies),
    discountPercent: z.number().int().min(minWorkDiscount).max(maxWorkDiscount).nullable(),
  })
  .refine(({ amount, discountPercent }) => discountedAmount(amount, discountPercent) >= 1, {
    message: "The price after the discount is 0",
    path: ["discountPercent"],
  });

/** Ids of the items of a gallery list a work refers to, at least one, each named once. */
function referenceIdsSchema(max: number) {
  return z
    .array(z.uuid())
    .min(1)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Each id must appear once");
}

/** Whether the month of the year has not come yet in any time zone. */
function isFutureMonth(year: number, month: number): boolean {
  const today = latestToday();

  return year > today.year || (year === today.year && month > today.month);
}

/** A work as the client sends it, to create one or to replace a saved one. Every field is sent. */
export const workBodySchema = z
  .strictObject({
    /** Whether the site shows the work; a hidden one is kept, as a draft or put aside. */
    published: z.boolean(),
    /** The name in the gallery, so it cannot be empty. */
    title: z.string().trim().min(1).max(100),
    /**
     * What the work is about, which the visitor reads beside it. Plain text: no HTML or Markdown.
     * Paragraphs are separated by a blank line.
     */
    description: z.string().trim().min(1).max(2_000),
    size: workSizeSchema,
    /** A work is dated by the month it was finished, which cannot be in the future. */
    year: z.number().int().min(minWorkYear),
    /** 1 for January. */
    month: z.number().int().min(1).max(12),
    /** The country the work was made in, by its ISO 3166-1 alpha-2 code, or null for none. */
    country: z.enum(countryCodes).nullable(),
    /** The city the work was made in, as it is written in Russian; an empty string for none. */
    city: z.string().trim().max(maxWorkCityLength),
    photo: photoBodySchema,
    /** How the work was made, in the order the site shows them; a saved photo left out is deleted. */
    processPhotos: photoListBodySchema(maxWorkProcessPhotos),
    /**
     * The sections and subsections the work is shown in, by id; at least one, so a visitor finds
     * it. A subsection is named alone: the site shows its works in its section too.
     */
    sectionIds: referenceIdsSchema(maxWorkSections),
    /** What the work is made of, by the ids of the gallery materials; at least one. */
    materialIds: referenceIdsSchema(maxWorkMaterials),
    /**
     * The colors a visitor finds the work by, by the ids of the gallery colors; at least one. A
     * black-and-white work has both black and white.
     */
    colorIds: referenceIdsSchema(maxWorkColors),
    /** The coloring of the work as a whole, by the ids of the gallery palettes; at least one. */
    paletteIds: referenceIdsSchema(maxWorkPalettes),
    /** The collection the work was painted for, or null for a work on its own. */
    collectionId: z.uuid().nullable(),
    format: z.enum(workFormats),
    /** How many works the set has; null for any other format, which tells its count itself. */
    partCount: z.number().int().min(minWorkSetSize).max(maxWorkSetSize).nullable(),
    saleStatus: z.enum(workSaleStatuses),
    /** Null for a work without a price. The price of a set is for all its works together. */
    price: workPriceBodySchema.nullable(),
  })
  .refine(({ month, year }) => !isFutureMonth(year, month), {
    message: "The month cannot be in the future",
    path: ["month"],
  })
  .refine(({ format, partCount }) => (format === "set") === (partCount !== null), {
    message: "A set needs its count of works, and any other format none",
    path: ["partCount"],
  });

/**
 * A work as stored in Firestore, in its own document of the `galleryWorks` collection. Only the
 * shape is checked: the rules above apply when a work is saved, so tightening a rule later never
 * makes a saved work unreadable.
 */
export const storedWorkSchema = z.object({
  published: z.boolean(),
  title: z.string(),
  description: z.string(),
  size: z.object({ width: z.number(), height: z.number() }),
  year: z.number(),
  month: z.number(),
  country: z.string().nullable(),
  city: z.string(),
  photo: storedPhotoSchema,
  processPhotos: z.array(storedListPhotoSchema),
  /** May name a section deleted since; the API leaves such ids out. */
  sectionIds: z.array(z.string()),
  /** May name a material deleted since; the API leaves such ids out. */
  materialIds: z.array(z.string()),
  /** May name a color deleted since; the API leaves such ids out. */
  colorIds: z.array(z.string()),
  /** May name a palette deleted since; the API leaves such ids out. */
  paletteIds: z.array(z.string()),
  /** Always a saved collection: deleting a collection takes its works out of it. */
  collectionId: z.string().nullable(),
  format: z.enum(workFormats),
  partCount: z.number().nullable(),
  saleStatus: z.enum(workSaleStatuses),
  price: z
    .object({
      amount: z.number(),
      currency: z.enum(workCurrencies),
      discountPercent: z.number().nullable(),
    })
    .nullable(),
  /** Set by the server when the work is created. */
  createdAt: z.instanceof(Timestamp),
  /** Set by the server whenever the admin saves the work. */
  updatedAt: z.instanceof(Timestamp),
});

export type WorkParams = z.infer<typeof workParamsSchema>;
export type WorkBody = z.infer<typeof workBodySchema>;
export type StoredWork = z.infer<typeof storedWorkSchema>;

/** The price of a work in a currency other than the one it is set in. */
export interface CurrencyPrice {
  /** By the rate, rounded up to a step. */
  amount: number;
  /** The amount after the same percent as the price in dollars. */
  finalAmount: number;
}

/** The price of a work as the API returns it. */
export interface WorkPrice {
  /** In whole units of the currency, before the discount. */
  amount: number;
  currency: (typeof workCurrencies)[number];
  discountPercent: number | null;
  /** The amount after the discount, rounded to a whole unit; computed, not stored. */
  finalAmount: number;
  /** The price in every other currency in use, by currency code; computed, not stored. */
  prices: Record<string, CurrencyPrice>;
}

/** A work as the API returns it. */
export interface Work {
  id: string;
  /** Whether the site shows the work. */
  published: boolean;
  title: string;
  description: string;
  /** In centimetres. */
  size: { width: number; height: number };
  /** The same size in inches, computed from the centimetres for the site; not stored. */
  sizeInches: { width: number; height: number };
  year: number;
  /** 1 for January. */
  month: number;
  /** The country the work was made in, by its ISO 3166-1 alpha-2 code, or null for none. */
  country: string | null;
  /** The city the work was made in; an empty string for none. */
  city: string;
  photo: Photo;
  /** In the order the site shows them. */
  processPhotos: ListPhoto[];
  /** The sections and subsections the work is shown in; a deleted one is left out. */
  sectionIds: string[];
  /** The materials the work is made of; a deleted one is left out. */
  materialIds: string[];
  /** The colors of the work; a deleted one is left out. */
  colorIds: string[];
  /** The palettes of the work; a deleted one is left out. */
  paletteIds: string[];
  /** Null for a work on its own. */
  collectionId: string | null;
  format: (typeof workFormats)[number];
  /** How many works the set has; null for any other format. */
  partCount: number | null;
  saleStatus: (typeof workSaleStatuses)[number];
  /** Null for a work without a price. */
  price: WorkPrice | null;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/**
 * A work in the list of works: everything but its description and its process photos, the heavy
 * parts that only the page of one work needs. A list of many works stays light.
 */
export type WorkSummary = Omit<Work, "description" | "processPhotos">;

export interface WorksResponse {
  /** In the order the site shows them: the latest first. */
  works: WorkSummary[];
}

/** How the works use one item of a gallery list, such as a material or a section. */
export interface ItemUsage {
  /** The works that name the item, or for a section, the section or any of its subsections. */
  count: number;
  /** Of those, the works that name nothing else of the list: removing the item leaves them none. */
  onlyCount: number;
}

/** How the works use each item of each gallery list a work names, by the id of the item. */
export interface WorkUsage {
  sections: Record<string, ItemUsage>;
  materials: Record<string, ItemUsage>;
  colors: Record<string, ItemUsage>;
  palettes: Record<string, ItemUsage>;
}
