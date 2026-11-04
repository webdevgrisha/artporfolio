import { revalidateUnlessOnlySearch } from "@/shared/lib/revalidateUnlessOnlySearch";

import {
  editCollectionHandle,
  editSectionHandle,
  editWorkHandle,
  newCollectionHandle,
  newSectionHandle,
  newWorkHandle,
} from "./model/galleryHandles";
import {
  galleryCollectionLoader,
  galleryCollectionsLoader,
  galleryColorsLoader,
  galleryIntroLoader,
  galleryMaterialsLoader,
  galleryPalettesLoader,
  gallerySectionLoader,
  gallerySectionsLoader,
  galleryWorkLoader,
  galleryWorksLoader,
  newGalleryCollectionLoader,
  newGalleryWorkLoader,
} from "./model/galleryRoute";
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

export const galleryIntroRoute = { Component: GalleryIntroSection, loader: galleryIntroLoader };

export const galleryWorksRoute = {
  Component: GalleryWorksSection,
  loader: galleryWorksLoader,
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryCollectionsRoute = {
  Component: GalleryCollectionsSection,
  loader: galleryCollectionsLoader,
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const gallerySectionsRoute = {
  Component: GallerySectionsSection,
  loader: gallerySectionsLoader,
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const galleryMaterialsRoute = {
  Component: GalleryMaterialsSection,
  loader: galleryMaterialsLoader,
};

export const galleryColorsRoute = { Component: GalleryColorsSection, loader: galleryColorsLoader };

export const galleryPalettesRoute = {
  Component: GalleryPalettesSection,
  loader: galleryPalettesLoader,
};

export const newWorkRoute = {
  Component: NewWorkPage,
  handle: newWorkHandle,
  loader: newGalleryWorkLoader,
};

export const editWorkRoute = {
  Component: EditWorkPage,
  handle: editWorkHandle,
  loader: galleryWorkLoader,
};

export const newCollectionRoute = {
  Component: NewCollectionPage,
  handle: newCollectionHandle,
  loader: newGalleryCollectionLoader,
};

export const editCollectionRoute = {
  Component: EditCollectionPage,
  handle: editCollectionHandle,
  loader: galleryCollectionLoader,
};

export const newSectionRoute = { Component: NewSectionPage, handle: newSectionHandle };

export const editSectionRoute = {
  Component: EditSectionPage,
  handle: editSectionHandle,
  loader: gallerySectionLoader,
};
