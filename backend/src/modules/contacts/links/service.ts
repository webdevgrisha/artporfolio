import type { DocumentSnapshot } from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import { type ContactLinks, contactLinksSchema } from "#modules/contacts/links/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

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
  return contactLinksSchema.parse({ ...emptyLinks, ...snapshot.data() });
}

/** The links with the entity tag for If-Match; the tag follows the stored links. */
export async function getContactLinks(): Promise<Tagged<ContactLinks>> {
  const links = readContactLinks(await contactsDocument().get());

  return { data: links, etag: entityTag(links) };
}

/** Replaces the links while they are still the ones the client read (`ifMatch`). */
export async function replaceContactLinks(
  links: ContactLinks,
  ifMatch: string,
): Promise<Tagged<ContactLinks>> {
  await firestore().runTransaction(async (transaction) => {
    const document = contactsDocument();

    assertIfMatch(ifMatch, readContactLinks(await transaction.get(document)));
    // Merging keeps the photo, which lives in the same document.
    transaction.set(document, links, { merge: true });
  });

  return { data: links, etag: entityTag(links) };
}
