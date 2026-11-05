import { contactsDocument } from "#modules/contacts/document";
import { type ContactLinks, contactLinksSchema } from "#modules/contacts/links/schema";
import { documentResource } from "#shared/http/document-resource";

/**
 * The contact links: fields of the contacts document itself, next to the photo. The document may
 * hold only the photo when the links were never saved.
 */
export const contactLinks = documentResource<ContactLinks>({
  document: contactsDocument,
  empty: { email: "", instagram: "", linkedin: "", youtube: "" },
  schema: contactLinksSchema,
});
