import { firestore } from "#shared/firebase/firestore";

/** The single document that holds the contact links and the slideshow. */
export function contactsDocument() {
  return firestore().doc("site/contacts");
}
