import { type Contacts, contactsSchema } from "#schemas/contacts";
import { firestore } from "#services/firestore";

const emptyContacts: Contacts = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

/** The single document that holds the contacts and the contact photo. */
export function contactsDocument() {
  return firestore().doc("site/contacts");
}

export async function getContacts(): Promise<Contacts> {
  const snapshot = await contactsDocument().get();

  // The document may not exist yet, or hold only the photo when the links were never saved.
  return contactsSchema.parse({ ...emptyContacts, ...snapshot.data() });
}

export async function saveContacts(contacts: Contacts): Promise<void> {
  // Merging keeps fields this form does not own, such as the future contact photo.
  await contactsDocument().set(contacts, { merge: true });
}
