import { useSuspenseQuery } from "@tanstack/react-query";

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
  sections: readonly GallerySection[];
}

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

  return {
    collections,
    colors: colors.data.colors,
    materials: materials.data.materials,
    palettes: palettes.data.palettes,
    sections,
  };
}
