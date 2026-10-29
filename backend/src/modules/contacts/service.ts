import { contactsDocument } from "#modules/contacts/document";
import { type Contacts, storedContactsSchema } from "#modules/contacts/schema";

const emptyContacts: Contacts = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

export async function getContacts(): Promise<Contacts> {
  const snapshot = await contactsDocument().get();

  // The document may not exist yet, or hold only the photo when the links were never saved.
  return storedContactsSchema.parse({ ...emptyContacts, ...snapshot.data() });
}

export async function saveContacts(contacts: Contacts): Promise<void> {
  // Merging keeps fields this form does not own, such as the future contact photo.
  await contactsDocument().set(contacts, { merge: true });
}
