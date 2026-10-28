import { type Contacts, contactsSchema } from "#schemas/contacts";
import { firestore } from "#services/firestore";

const emptyContacts: Contacts = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

function contactsDocument() {
  return firestore().doc("site/contacts");
}

export async function getContacts(): Promise<Contacts> {
  const snapshot = await contactsDocument().get();

  return snapshot.exists ? contactsSchema.parse(snapshot.data()) : emptyContacts;
}

export async function saveContacts(contacts: Contacts): Promise<void> {
  // Merging keeps fields this form does not own, such as the future contact photo.
  await contactsDocument().set(contacts, { merge: true });
}
