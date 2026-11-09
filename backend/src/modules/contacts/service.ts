import { contactsDocument } from "#modules/contacts/document";
import { contactLinks } from "#modules/contacts/links/resource";
import { contactPhoto } from "#modules/contacts/photo";
import type { ContactsResponse } from "#modules/contacts/schema";
import { toPhoto } from "#shared/images/photo";
import { readSlot } from "#shared/images/slot";

/** One read for the whole page: the links and the contact photo. */
export async function getContacts(): Promise<ContactsResponse> {
  const snapshot = await contactsDocument().get();
  const photo = readSlot(contactPhoto, snapshot);

  return {
    links: contactLinks.read(snapshot),
    photo: photo && toPhoto(photo),
  };
}
