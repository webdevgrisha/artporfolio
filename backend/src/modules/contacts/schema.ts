import type { ContactLinks } from "#modules/contacts/links/schema";
import type { Photo } from "#shared/images/photo";

/** The whole contacts page in one read, for the site; each part is changed at its own resource. */
export interface ContactsResponse {
  links: ContactLinks;
  /**
   * What the slideshow shows, in order: the uploaded photos, or the landscape photos of the
   * published works. Empty when there are none.
   */
  photos: Photo[];
}
