import { contactsDocument } from "#modules/contacts/document";
import { type ContactLinks, contactLinksSchema } from "#modules/contacts/links/schema";
import { documentResource } from "#shared/firebase/document-resource";

/** The contact links, in a field of the document that also holds the contact photo. */
export const contactLinks = documentResource<ContactLinks>({
  document: contactsDocument,
  empty: { email: "", instagram: "", linkedin: "", youtube: "" },
  field: "links",
  schema: contactLinksSchema,
});
