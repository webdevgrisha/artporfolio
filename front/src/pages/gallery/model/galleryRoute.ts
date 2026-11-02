import { galleryIntroQuery } from "@/entities/gallery";
import { queryClient } from "@/shared/api/queryClient";

// Each section loads its own resources afresh on entering it, even when they are cached: a form,
// or the list, takes its saved values and their ETag from them once, so they must not be outdated.

export async function galleryIntroLoader() {
  await queryClient.fetchQuery({ ...galleryIntroQuery, staleTime: 0 });

  return null;
}
