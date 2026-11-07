import { type GalleryIntro, galleryIntroSchema } from "#modules/gallery/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { documentResource } from "#shared/http/document-resource";

/** The text above the works in the gallery. */
export const galleryIntro = documentResource<GalleryIntro>({
  document: () => firestore().doc("site/galleryIntro"),
  empty: { text: "" },
  schema: galleryIntroSchema,
  translated: { resource: "gallery-intro", texts: ({ text }) => ({ text }) },
});
