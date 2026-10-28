import { firestore } from "#shared/firebase/firestore";

/** The single document that holds the contact links and the contact photo. */
export function contactsDocument() {
  return firestore().doc("site/contacts");
}
