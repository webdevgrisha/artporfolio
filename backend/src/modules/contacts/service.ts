import { contactsDocument } from "#modules/contacts/document";
import { readContactLinks } from "#modules/contacts/links/service";
import { contactPhoto } from "#modules/contacts/photo";
import type { ContactsResponse } from "#modules/contacts/schema";
import { readPhoto, toPhoto } from "#shared/images/photo";

/** One read for the whole page: the links and the contact photo. */
export async function getContacts(): Promise<ContactsResponse> {
  const snapshot = await contactsDocument().get();
  const photo = readPhoto(contactPhoto, snapshot);

  return {
    links: readContactLinks(snapshot),
    photo: photo && toPhoto(photo),
  };
}
