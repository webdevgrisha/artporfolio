import { aboutDocument } from "#modules/about/document";
import { type AboutText, aboutTextSchema } from "#modules/about/text/schema";
import { translatedResource } from "#shared/i18n/translated-resource";

/** The texts of the About page, in a field of the document that also holds the photos. */
export const aboutText = translatedResource<AboutText>({
  document: aboutDocument,
  empty: { about: "", biography: "", creation: "" },
  field: "text",
  schema: aboutTextSchema,
  sources: ({ about, biography, creation }) => ({ about, biography, creation }),
});
