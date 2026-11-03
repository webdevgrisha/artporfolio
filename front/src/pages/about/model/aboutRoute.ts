import { aboutPhoto, aboutTextQuery, processPhotosQuery } from "@/entities/about";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// Each section loads its own resource afresh on entering it, and shows its skeleton meanwhile.

export function aboutTextLoader() {
  return loadPageData(fetchFresh(aboutTextQuery));
}

export function aboutPhotoLoader() {
  return loadPageData(fetchFresh(aboutPhoto.query));
}

export function aboutProcessLoader() {
  return loadPageData(fetchFresh(processPhotosQuery));
}
