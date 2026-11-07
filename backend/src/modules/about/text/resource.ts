import { aboutDocument } from "#modules/about/document";
import { type AboutText, aboutTextSchema } from "#modules/about/text/schema";
import { documentResource } from "#shared/http/document-resource";

/** The texts of the About page, in a field of the document that also holds the photos. */
export const aboutText = documentResource<AboutText>({
  document: aboutDocument,
  empty: { about: "", biography: "", creation: "" },
  field: "text",
  schema: aboutTextSchema,
  translated: {
    resource: "about-text",
    texts: ({ about, biography, creation }) => ({ about, biography, creation }),
  },
});
