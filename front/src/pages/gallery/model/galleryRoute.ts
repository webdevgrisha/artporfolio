import type { LoaderFunctionArgs } from "react-router";

import { currencyRatesQuery } from "@/entities/currency";
import {
  galleryCollectionQuery,
  galleryCollectionsQuery,
  galleryColorsQuery,
  galleryIntroQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionQuery,
  gallerySectionsQuery,
  galleryWorkQuery,
  galleryWorksQuery,
  galleryWorkUsageQuery,
} from "@/entities/gallery";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// Each section loads its own resources afresh on entering it, and shows its skeleton meanwhile.

export function galleryIntroLoader() {
  return loadPageData(fetchFresh(galleryIntroQuery));
}

// The lists that works name tell how many works name each item, and warn before one they name is
// removed, so their pages load the counts too (not the works: the server counts them).

export function gallerySectionsLoader() {
  return loadPageData(fetchFresh(gallerySectionsQuery), fetchFresh(galleryWorkUsageQuery));
}

export function gallerySectionLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(
    fetchFresh(gallerySectionQuery(params.id ?? "")),
    fetchFresh(galleryWorkUsageQuery),
  );
}

// The works name their sections, materials, colors, palettes and collection by id, so their pages
// load those lists too; the table names only the sections and the materials.

export function galleryWorksLoader() {
  return loadPageData(
    fetchFresh(galleryWorksQuery),
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
    fetchFresh(galleryCollectionsQuery),
  );
}

export function newGalleryWorkLoader() {
  return loadPageData(
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
    fetchFresh(galleryColorsQuery),
    fetchFresh(galleryPalettesQuery),
    fetchFresh(galleryCollectionsQuery),
    fetchFresh(currencyRatesQuery),
  );
}

export function galleryWorkLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(
    fetchFresh(galleryWorkQuery(params.id ?? "")),
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
    fetchFresh(galleryColorsQuery),
    fetchFresh(galleryPalettesQuery),
    fetchFresh(galleryCollectionsQuery),
    fetchFresh(currencyRatesQuery),
  );
}

export function galleryCollectionsLoader() {
  return loadPageData(fetchFresh(galleryCollectionsQuery));
}

// A collection shows its works and adds others, naming the collection each one is in now, so its
// pages load every work and every collection.

export function newGalleryCollectionLoader() {
  return loadPageData(fetchFresh(galleryWorksQuery), fetchFresh(galleryCollectionsQuery));
}

export function galleryCollectionLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(
    fetchFresh(galleryCollectionQuery(params.id ?? "")),
    fetchFresh(galleryWorksQuery),
    fetchFresh(galleryCollectionsQuery),
  );
}

// As the sections, these lists load the counts of works too.

export function galleryMaterialsLoader() {
  return loadPageData(fetchFresh(galleryMaterialsQuery), fetchFresh(galleryWorkUsageQuery));
}

export function galleryColorsLoader() {
  return loadPageData(fetchFresh(galleryColorsQuery), fetchFresh(galleryWorkUsageQuery));
}

export function galleryPalettesLoader() {
  return loadPageData(fetchFresh(galleryPalettesQuery), fetchFresh(galleryWorkUsageQuery));
}
