import { contactsDocument } from "#modules/contacts/document";
import { readContactLinks } from "#modules/contacts/links/service";
import { readContactPhoto } from "#modules/contacts/photo/service";
import type { ContactsResponse } from "#modules/contacts/schema";
import { toPhoto } from "#shared/images/photo";

/** One read for the whole page: the links and the contact photo. */
export async function getContacts(): Promise<ContactsResponse> {
  const snapshot = await contactsDocument().get();
  const photo = readContactPhoto(snapshot);

  return {
    links: readContactLinks(snapshot),
    photo: photo && toPhoto(photo),
  };
}
