import type { LoaderFunctionArgs } from "react-router";

import {
  galleryColorsQuery,
  galleryIntroQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionQuery,
  gallerySectionsQuery,
} from "@/entities/gallery";
import { queryClient } from "@/shared/api/queryClient";

// Each section loads its own resources afresh on entering it, even when they are cached: a form,
// or the list, takes its saved values and their ETag from them once, so they must not be outdated.

export async function galleryIntroLoader() {
  await queryClient.fetchQuery({ ...galleryIntroQuery, staleTime: 0 });

  return null;
}

export async function gallerySectionsLoader() {
  await queryClient.fetchQuery({ ...gallerySectionsQuery, staleTime: 0 });

  return null;
}

export async function gallerySectionLoader({ params }: LoaderFunctionArgs) {
  await queryClient.fetchQuery({ ...gallerySectionQuery(params.id ?? ""), staleTime: 0 });

  return null;
}

export async function galleryMaterialsLoader() {
  await queryClient.fetchQuery({ ...galleryMaterialsQuery, staleTime: 0 });

  return null;
}

export async function galleryColorsLoader() {
  await queryClient.fetchQuery({ ...galleryColorsQuery, staleTime: 0 });

  return null;
}

export async function galleryPalettesLoader() {
  await queryClient.fetchQuery({ ...galleryPalettesQuery, staleTime: 0 });

  return null;
}
