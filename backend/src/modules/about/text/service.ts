import type { DocumentSnapshot } from "firebase-admin/firestore";

import { aboutDocument } from "#modules/about/document";
import { type AboutText, aboutTextSchema } from "#modules/about/text/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

/** The field of the About document that holds the texts. */
const field = "text";

const emptyText: AboutText = { about: "", biography: "", creation: "" };

/** The saved texts; every text is empty until they are first saved. */
export function readAboutText(snapshot: DocumentSnapshot): AboutText {
  const text: unknown = snapshot.get(field);

  return text === undefined ? emptyText : aboutTextSchema.parse(text);
}

/** The texts with the entity tag for If-Match; the tag follows the stored texts. */
export async function getAboutText(): Promise<Tagged<AboutText>> {
  const text = readAboutText(await aboutDocument().get());

  return { data: text, etag: entityTag(text) };
}

/** Replaces the texts while they are still the ones the client read (`ifMatch`). */
export async function replaceAboutText(
  text: AboutText,
  ifMatch: string,
): Promise<Tagged<AboutText>> {
  await firestore().runTransaction(async (transaction) => {
    const document = aboutDocument();

    assertIfMatch(ifMatch, readAboutText(await transaction.get(document)));
    // Merging keeps the photos, which live in the same document.
    transaction.set(document, { [field]: text }, { merge: true });
  });

  return { data: text, etag: entityTag(text) };
}
