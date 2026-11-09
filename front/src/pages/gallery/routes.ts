import type { LoaderFunctionArgs } from "react-router";

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
import { workReferenceQueries } from "@/features/edit-gallery";
import { loadCached, loadFresh } from "@/shared/api/pageData";
import { revalidateUnlessOnlySearch } from "@/shared/lib/revalidateUnlessOnlySearch";

import {
  editCollectionHandle,
  editSectionHandle,
  editWorkHandle,
  newCollectionHandle,
  newSectionHandle,
  newWorkHandle,
} from "./model/galleryHandles";
import { EditCollectionPage } from "./ui/EditCollectionPage";
import { EditSectionPage } from "./ui/EditSectionPage";
import { EditWorkPage } from "./ui/EditWorkPage";
import { GalleryCollectionsSection } from "./ui/GalleryCollectionsSection";
import { GalleryColorsSection } from "./ui/GalleryColorsSection";
import { GalleryIntroSection } from "./ui/GalleryIntroSection";
import { GalleryMaterialsSection } from "./ui/GalleryMaterialsSection";
import { GalleryPage } from "./ui/GalleryPage";
import { GalleryPalettesSection } from "./ui/GalleryPalettesSection";
import { GallerySectionsSection } from "./ui/GallerySectionsSection";
import { GalleryWorksSection } from "./ui/GalleryWorksSection";
import { NewCollectionPage } from "./ui/NewCollectionPage";
import { NewSectionPage } from "./ui/NewSectionPage";
import { NewWorkPage } from "./ui/NewWorkPage";

/** The page with the tabs of the gallery; each tab is a route of its own. */
export const galleryRoute = { Component: GalleryPage };

export const galleryIntroRoute = {
  Component: GalleryIntroSection,
  loader: () => loadFresh(galleryIntroQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryWorksRoute = {
  Component: GalleryWorksSection,
  // The table names the sections, the materials and the collection of each work.
  loader: () =>
    loadCached(
      galleryWorksQuery,
      gallerySectionsQuery,
      galleryMaterialsQuery,
      galleryCollectionsQuery,
    ),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryCollectionsRoute = {
  Component: GalleryCollectionsSection,
  loader: () => loadCached(galleryCollectionsQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

// The lists that works name tell how many works name each item, and warn before one they name is
// removed, so their pages load the counts too (not the works: the server counts them).

export const gallerySectionsRoute = {
  Component: GallerySectionsSection,
  loader: () => loadCached(gallerySectionsQuery, galleryWorkUsageQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryMaterialsRoute = {
  Component: GalleryMaterialsSection,
  loader: () => loadFresh(galleryMaterialsQuery, galleryWorkUsageQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryColorsRoute = {
  Component: GalleryColorsSection,
  loader: () => loadFresh(galleryColorsQuery, galleryWorkUsageQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryPalettesRoute = {
  Component: GalleryPalettesSection,
  loader: () => loadFresh(galleryPalettesQuery, galleryWorkUsageQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const newWorkRoute = {
  Component: NewWorkPage,
  handle: newWorkHandle,
  loader: () => loadFresh(...workReferenceQueries),
};

export const editWorkRoute = {
  Component: EditWorkPage,
  handle: editWorkHandle,
  loader: ({ params }: LoaderFunctionArgs) =>
    loadFresh(galleryWorkQuery(params.id ?? ""), ...workReferenceQueries),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

// A collection shows its works and adds free ones, so its pages load every work.

export const newCollectionRoute = {
  Component: NewCollectionPage,
  handle: newCollectionHandle,
  loader: () => loadFresh(galleryWorksQuery),
};

export const editCollectionRoute = {
  Component: EditCollectionPage,
  handle: editCollectionHandle,
  loader: ({ params }: LoaderFunctionArgs) =>
    loadFresh(galleryCollectionQuery(params.id ?? ""), galleryWorksQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const newSectionRoute = { Component: NewSectionPage, handle: newSectionHandle };

export const editSectionRoute = {
  Component: EditSectionPage,
  handle: editSectionHandle,
  loader: ({ params }: LoaderFunctionArgs) =>
    loadFresh(gallerySectionQuery(params.id ?? ""), galleryWorkUsageQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};
