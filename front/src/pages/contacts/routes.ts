import { contactLinksQuery, contactPhoto } from "@/entities/contacts";
import { loadFresh } from "@/shared/api/pageData";

import { ContactLinksSection } from "./ui/ContactLinksSection";
import { ContactPhotoSection } from "./ui/ContactPhotoSection";
import { ContactsPage } from "./ui/ContactsPage";

/** The page with the tabs of the contacts; each tab is a route of its own. */
export const contactsRoute = { Component: ContactsPage };

export const contactLinksRoute = {
  Component: ContactLinksSection,
  loader: () => loadFresh(contactLinksQuery),
};

export const contactPhotoRoute = {
  Component: ContactPhotoSection,
  loader: () => loadFresh(contactPhoto.query),
};
