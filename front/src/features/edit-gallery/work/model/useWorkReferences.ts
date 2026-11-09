import { useSuspenseQuery } from "@tanstack/react-query";

import { type CurrencyRates, currencyRatesQuery } from "@/entities/currency";
import {
  type GalleryCollection,
  type GalleryColor,
  type GalleryMaterial,
  type GalleryPalette,
  type GallerySection,
  galleryCollectionsQuery,
  galleryColorsQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionsQuery,
} from "@/entities/gallery";

/** The lists of the gallery a work refers to, each sorted as the site lists it. */
export interface WorkReferences {
  collections: readonly GalleryCollection[];
  colors: readonly GalleryColor[];
  materials: readonly GalleryMaterial[];
  palettes: readonly GalleryPalette[];
  /** How many units of each currency in use one US dollar buys. */
  rates: CurrencyRates["rates"];
  sections: readonly GallerySection[];
}

/** The queries of the lists a work form chooses from, which its page loads. */
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
    colors: colors.data,
    materials: materials.data,
    palettes: palettes.data,
    rates: rates.data.rates,
    sections,
  };
}
