import { firestore } from "#shared/firebase/firestore";

/** The single document that holds the About texts, «My photo» and the process photos. */
export function aboutDocument() {
  return firestore().doc("site/about");
}
