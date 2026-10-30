import type { DocumentSnapshot } from "firebase-admin/firestore";

import { aboutDocument } from "#modules/about/document";
import { type AboutText, storedAboutTextSchema } from "#modules/about/text/schema";

/** The field of the About document that holds the texts. */
const field = "text";

const emptyText: AboutText = { about: "", biography: "", creation: "" };

/** The saved texts; every text is empty until they are first saved. */
export function readAboutText(snapshot: DocumentSnapshot): AboutText {
  const text: unknown = snapshot.get(field);

  return text === undefined ? emptyText : storedAboutTextSchema.parse(text);
}

export async function getAboutText(): Promise<AboutText> {
  return readAboutText(await aboutDocument().get());
}

export async function saveAboutText(text: AboutText): Promise<void> {
  // Merging keeps the photos, which live in the same document.
  await aboutDocument().set({ [field]: text }, { merge: true });
}
