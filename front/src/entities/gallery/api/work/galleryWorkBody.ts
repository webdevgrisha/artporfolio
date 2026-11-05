import type { ListPhotoItem, PhotoBody } from "@/shared/api/photo";

import type { WorkFormat, WorkPrice, WorkSaleStatus, WorkSize } from "../../model/galleryWork";

/** A work as the admin saves it: every field at once. */
export interface GalleryWorkBody {
  /** Whether the site shows the work. */
  published: boolean;
  title: string;
  description: string;
  size: WorkSize;
  year: number;
  /** 1 for January. */
  month: number;
  /** The country the work was made in, by its ISO 3166-1 alpha-2 code, or null for none. */
  country: string | null;
  /** The city the work was made in; an empty string for none. */
  city: string;
  photo: PhotoBody;
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: readonly ListPhotoItem[];
  /** The sections and subsections the work is shown in, at least one. */
  sectionIds: readonly string[];
  /** The materials the work is made of, at least one. */
  materialIds: readonly string[];
  /** The colors a visitor finds the work by, at least one. */
  colorIds: readonly string[];
  /** The coloring of the work as a whole, at least one palette. */
  paletteIds: readonly string[];
  /** The collection the work was painted for, or null for a work on its own. */
  collectionId: string | null;
  format: WorkFormat;
  /** How many works the set has; null for any other format. */
  partCount: number | null;
  saleStatus: WorkSaleStatus;
  /** Null for a work without a price; the server computes the amount after the discount. */
  price: Omit<WorkPrice, "finalAmount"> | null;
}
