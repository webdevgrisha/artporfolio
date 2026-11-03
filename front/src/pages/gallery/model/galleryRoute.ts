import type { LoaderFunctionArgs } from "react-router";

import {
  galleryColorsQuery,
  galleryIntroQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionQuery,
  gallerySectionsQuery,
  galleryWorkQuery,
  galleryWorksQuery,
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

// The works name their sections, materials, colors and palettes by id, so their pages load those
// lists too; the table names only the sections and the materials.

export function galleryWorksLoader() {
  return loadPageData(
    fetchFresh(galleryWorksQuery),
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
  );
}

export function newGalleryWorkLoader() {
  return loadPageData(
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
    fetchFresh(galleryColorsQuery),
    fetchFresh(galleryPalettesQuery),
  );
}

export function galleryWorkLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(
    fetchFresh(galleryWorkQuery(params.id ?? "")),
    fetchFresh(gallerySectionsQuery),
    fetchFresh(galleryMaterialsQuery),
    fetchFresh(galleryColorsQuery),
    fetchFresh(galleryPalettesQuery),
  );
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
