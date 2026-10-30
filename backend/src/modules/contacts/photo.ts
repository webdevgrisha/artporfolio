import { contactsDocument } from "#modules/contacts/document";
import { photoSlot } from "#shared/images/photo";

/** The photo of the contacts page. */
export const contactPhoto = photoSlot({
  document: contactsDocument,
  field: "photo",
  folder: "contacts/photo",
});
