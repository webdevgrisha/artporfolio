import { contactLinksQuery, contactPhoto } from "@/entities/contacts";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// Each section loads its own resource afresh on entering it, and shows its skeleton meanwhile.

export function contactLinksLoader() {
  return loadPageData(fetchFresh(contactLinksQuery));
}

export function contactPhotoLoader() {
  return loadPageData(fetchFresh(contactPhoto.query));
}
