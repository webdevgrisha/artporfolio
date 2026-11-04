import { z } from "zod";

import { listPhotoSchema, photoSchema } from "@/shared/api/photo";

/** The earliest year a work can be dated (backend/src/modules/gallery-works/schema.ts). */
export const minWorkYear = 1900;

/** The most sections and subsections one work may be in. */
export const maxWorkSections = 30;

/** The most materials one work may be made of. */
export const maxWorkMaterials = 10;

/** The most colors one work may have. */
export const maxWorkColors = 10;

/** The most palettes one work may have. */
export const maxWorkPalettes = 5;

/** The most process photos one work may have. */
export const maxWorkProcessPhotos = 20;

/** How many works a set may have; two or three are a diptych or a triptych. */
export const minWorkSetSize = 2;
export const maxWorkSetSize = 100;

/**
 * What the work is made up of: one work, a diptych or triptych (one work of two or three panels), or
 * a set of separate works, most often prints of an original, which says how many it has.
 */
export const workFormats = ["single", "diptych", "triptych", "set"] as const;

export type WorkFormat = (typeof workFormats)[number];

/** The longest name of the city a work was made in. */
export const maxWorkCityLength = 100;

/**
 * Whether a visitor can buy the work: for sale, reserved for a buyer who has not paid yet, sold, or
 * not for sale at all. Apart from the price: a sold work keeps the price it was sold for.
 */
export const workSaleStatuses = ["available", "reserved", "sold", "notForSale"] as const;

export type WorkSaleStatus = (typeof workSaleStatuses)[number];

/** The only currency a price is set in for now. */
export const workCurrencies = ["USD"] as const;

export type WorkCurrency = (typeof workCurrencies)[number];

/** The highest price in whole dollars. */
export const maxWorkPrice = 100_000_000;

/** A discount takes off a whole percent of the price, from 1 to 99. */
export const minWorkDiscount = 1;
export const maxWorkDiscount = 99;

/** The price of a work in whole units of its currency. */
export const workPriceSchema = z.object({
  amount: z.number(),
  currency: z.enum(workCurrencies),
  /** The percent taken off the amount, or null for none. */
  discountPercent: z.number().nullable(),
  /** The amount after the discount, which the server computes. */
  finalAmount: z.number(),
});

export type WorkPrice = z.infer<typeof workPriceSchema>;

/** The largest side of a work in centimetres. */
export const maxWorkSide = 10_000;

/** The size of a work in centimetres; the site converts it for visitors who read inches. */
export const workSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type WorkSize = z.infer<typeof workSizeSchema>;

/** A work of the gallery. */
export const galleryWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  size: workSizeSchema,
  /** The year the work was finished. */
  year: z.number(),
  /** The month the work was finished, 1 for January. */
  month: z.number(),
  /** The country the work was made in, by its ISO 3166-1 alpha-2 code, or null for none. */
  country: z.string().nullable(),
  /** The city the work was made in; an empty string for none. */
  city: z.string(),
  photo: photoSchema,
  /** How the work was made, in the order the site shows them. */
  processPhotos: z.array(listPhotoSchema),
  /** The ids of the sections and subsections the work is shown in. */
  sectionIds: z.array(z.string()),
  /** The ids of the materials the work is made of. */
  materialIds: z.array(z.string()),
  /** The ids of the colors a visitor finds the work by. */
  colorIds: z.array(z.string()),
  /** The ids of the palettes: the coloring of the work as a whole. */
  paletteIds: z.array(z.string()),
  /** The id of the collection the work was painted for, or null for a work on its own. */
  collectionId: z.string().nullable(),
  format: z.enum(workFormats),
  /** How many works the set has; null for any other format. */
  partCount: z.number().nullable(),
  saleStatus: z.enum(workSaleStatuses),
  /** Null for a work without a price. The price of a set is for all its works together. */
  price: workPriceSchema.nullable(),
  /** When the work was created, ISO 8601. */
  createdAt: z.iso.datetime(),
  /** When the admin last saved the work, ISO 8601. */
  updatedAt: z.iso.datetime(),
});

export type GalleryWork = z.infer<typeof galleryWorkSchema>;

/** The shape of every API response that returns one work. */
export const galleryWorkResponseSchema = z.object({
  work: galleryWorkSchema,
});

export const galleryWorksResponseSchema = z.object({
  /** In the order the site shows them: the latest first. */
  works: z.array(galleryWorkSchema),
});
