import { useSuspenseQuery } from "@tanstack/react-query";

import { type CurrencyRates, currencyRatesQuery } from "@/entities/currency";
import {
  type GalleryCollectionSummary,
  type GalleryColor,
  type GalleryMaterial,
  type GalleryPalette,
  type GallerySectionSummary,
  galleryCollectionsQuery,
  galleryColorsQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionsQuery,
} from "@/entities/gallery";

/** The lists of the gallery a work refers to, each sorted as the site lists it. */
export interface WorkReferences {
  collections: readonly GalleryCollectionSummary[];
  colors: readonly GalleryColor[];
  materials: readonly GalleryMaterial[];
  palettes: readonly GalleryPalette[];
  /** How many units of each currency in use one US dollar buys. */
  rates: CurrencyRates["rates"];
  sections: readonly GallerySectionSummary[];
}

/** The queries of the lists a work form chooses from: its page loads them, a conflict reloads them. */
export const workReferenceQueries = [
  gallerySectionsQuery,
  galleryMaterialsQuery,
  galleryColorsQuery,
  galleryPalettesQuery,
  galleryCollectionsQuery,
  currencyRatesQuery,
] as const;

/**
 * The lists a work form chooses from, read from the cache. A page calls it once the loader has put
 * them there, so it never suspends.
 */
export function useWorkReferences(): WorkReferences {
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);
  const { data: palettes } = useSuspenseQuery(galleryPalettesQuery);
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);
  const { data: rates } = useSuspenseQuery(currencyRatesQuery);

  return {
    collections,
    colors: colors.data.items,
    materials: materials.data.items,
    palettes: palettes.data.items,
    rates: rates.data.rates,
    sections,
  };
}
