import { aboutPhotoQuery, aboutTextQuery, processPhotosQuery } from "@/entities/about";
import { queryClient } from "@/shared/api/queryClient";

// Each section loads its own resource afresh on entering it, even when it is cached: the form
// takes its saved values and their ETag from it once, so they must not be outdated.

export async function aboutTextLoader() {
  await queryClient.fetchQuery({ ...aboutTextQuery, staleTime: 0 });

  return null;
}

export async function aboutPhotoLoader() {
  await queryClient.fetchQuery({ ...aboutPhotoQuery, staleTime: 0 });

  return null;
}

export async function aboutProcessLoader() {
  await queryClient.fetchQuery({ ...processPhotosQuery, staleTime: 0 });

  return null;
}
