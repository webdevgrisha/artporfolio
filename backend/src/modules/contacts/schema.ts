import type { ContactLinks } from "#modules/contacts/links/schema";
import type { Photo } from "#shared/images/photo";

/** The whole contacts page in one read, for the site; each part is changed at its own resource. */
export interface ContactsResponse {
  links: ContactLinks;
  /** null until a photo is uploaded. */
  photo: Photo | null;
}
