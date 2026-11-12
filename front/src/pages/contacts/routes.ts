import { contactLinksQuery, slideshowQuery } from "@/entities/contacts";
import { loadFresh } from "@/shared/api/pageData";

import { ContactLinksSection } from "./ui/ContactLinksSection";
import { ContactSlideshowSection } from "./ui/ContactSlideshowSection";
import { ContactsPage } from "./ui/ContactsPage";

/** The page with the tabs of the contacts; each tab is a route of its own. */
export const contactsRoute = { Component: ContactsPage };

export const contactLinksRoute = {
  Component: ContactLinksSection,
  loader: () => loadFresh(contactLinksQuery),
};

export const contactSlideshowRoute = {
  Component: ContactSlideshowSection,
  loader: () => loadFresh(slideshowQuery),
};
