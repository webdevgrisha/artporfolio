import { aboutDocument } from "#modules/about/document";
import { photoSlot } from "#shared/images/photo";

/** «My photo», the portrait next to the introduction. */
export const aboutPhoto = photoSlot({
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
});
