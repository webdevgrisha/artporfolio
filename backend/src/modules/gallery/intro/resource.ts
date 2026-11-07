import { type GalleryIntro, galleryIntroSchema } from "#modules/gallery/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { translatedResource } from "#shared/i18n/translated-resource";

/** The text above the works in the gallery. */
export const galleryIntro = translatedResource<GalleryIntro>({
  document: () => firestore().doc("site/galleryIntro"),
  empty: { text: "" },
  schema: galleryIntroSchema,
  sources: ({ text }) => ({ text }),
});
