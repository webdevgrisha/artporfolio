import type { MessageKey } from "@/lib/i18n/translate";

/**
 * The pages of the menu of the site, by their path under a language and the key of their name, in
 * the order of what a visitor comes for: the works first, which the site shows and sells; then the
 * exhibitions, past and current, which the life of the artist turns on; the projects; the artist;
 * and the way to reach her last, where every site has it. The header and the footer both list them
 * in this order, including the pages not built yet.
 *
 * `page` is the id of the page in the admin («Страницы»), whose hero the menu shows under the
 * pointer; a page without one there has none.
 */
export const menu = [
  { label: "menu.gallery", page: "gallery", path: "/gallery" },
  { label: "menu.exhibitions", page: undefined, path: "/exhibitions" },
  { label: "menu.projects", page: "projects", path: "/projects" },
  { label: "menu.about", page: "about", path: "/about" },
  { label: "menu.contact", page: "contacts", path: "/contact" },
] as const satisfies readonly { label: MessageKey; page: string | undefined; path: string }[];
