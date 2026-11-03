import type { LoaderFunctionArgs } from "react-router";

import {
  galleryColorsQuery,
  galleryIntroQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionQuery,
  gallerySectionsQuery,
} from "@/entities/gallery";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// Each section loads its own resources afresh on entering it, and shows its skeleton meanwhile.

export function galleryIntroLoader() {
  return loadPageData(fetchFresh(galleryIntroQuery));
}

export function gallerySectionsLoader() {
  return loadPageData(fetchFresh(gallerySectionsQuery));
}

export function gallerySectionLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(fetchFresh(gallerySectionQuery(params.id ?? "")));
}

export function galleryMaterialsLoader() {
  return loadPageData(fetchFresh(galleryMaterialsQuery));
}

export function galleryColorsLoader() {
  return loadPageData(fetchFresh(galleryColorsQuery));
}

export function galleryPalettesLoader() {
  return loadPageData(fetchFresh(galleryPalettesQuery));
}
