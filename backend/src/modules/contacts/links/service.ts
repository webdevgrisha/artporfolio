import type { DocumentSnapshot } from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import { type ContactLinks, storedContactLinksSchema } from "#modules/contacts/links/schema";

const emptyLinks: ContactLinks = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

/**
 * The saved links. They are fields of the contacts document itself, next to the photo; the
 * document may not exist yet, or hold only the photo when the links were never saved.
 */
export function readContactLinks(snapshot: DocumentSnapshot): ContactLinks {
  return storedContactLinksSchema.parse({ ...emptyLinks, ...snapshot.data() });
}

export async function getContactLinks(): Promise<ContactLinks> {
  return readContactLinks(await contactsDocument().get());
}

export async function saveContactLinks(links: ContactLinks): Promise<void> {
  // Merging keeps the photo, which lives in the same document.
  await contactsDocument().set(links, { merge: true });
}
