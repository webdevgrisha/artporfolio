import { contactsDocument } from "#modules/contacts/document";
import {
  type Contacts,
  type ContactsResponse,
  storedContactsSchema,
} from "#modules/contacts/schema";
import { readPhoto, toPhoto } from "#shared/images/photo";

const emptyContacts: Contacts = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

/** One read for the whole page: the links and the contact photo. */
export async function getContacts(): Promise<ContactsResponse> {
  const snapshot = await contactsDocument().get();
  const photo = readPhoto(snapshot, "photo");

  return {
    // The document may not exist yet, or hold only the photo when the links were never saved.
    contacts: storedContactsSchema.parse({ ...emptyContacts, ...snapshot.data() }),
    photo: photo && toPhoto(photo),
  };
}

export async function saveContacts(contacts: Contacts): Promise<void> {
  // Merging keeps fields this form does not own, such as the future contact photo.
  await contactsDocument().set(contacts, { merge: true });
}
