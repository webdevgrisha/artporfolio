import { aboutPhoto, aboutTextQuery, processPhotosQuery } from "@/entities/about";
import { loadFresh } from "@/shared/api/pageData";

import { AboutPage } from "./ui/AboutPage";
import { AboutPhotoSection } from "./ui/AboutPhotoSection";
import { AboutProcessSection } from "./ui/AboutProcessSection";
import { AboutTextSection } from "./ui/AboutTextSection";

/** The page with the tabs of «О сайте»; each tab has its own form, route and resource. */
export const aboutRoute = { Component: AboutPage };

export const aboutTextRoute = {
  Component: AboutTextSection,
  loader: () => loadFresh(aboutTextQuery),
};

export const aboutPhotoRoute = {
  Component: AboutPhotoSection,
  loader: () => loadFresh(aboutPhoto.query),
};

export const aboutProcessRoute = {
  Component: AboutProcessSection,
  loader: () => loadFresh(processPhotosQuery),
};
