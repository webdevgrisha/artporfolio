import { contactLinksQuery, contactPhotoQuery } from "@/entities/contacts";
import { queryClient } from "@/shared/api/queryClient";

// Each section loads its own resource afresh on entering it, even when it is cached: the form
// takes its saved values and their ETag from it once, so they must not be outdated.

export async function contactLinksLoader() {
  await queryClient.fetchQuery({ ...contactLinksQuery, staleTime: 0 });

  return null;
}

export async function contactPhotoLoader() {
  await queryClient.fetchQuery({ ...contactPhotoQuery, staleTime: 0 });

  return null;
}
