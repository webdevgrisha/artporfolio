import type { MessageKey } from "@/lib/i18n/translate";

/**
 * The pages of the menu of the site, by their path under a language and the key of their name, in
 * the order of what a visitor comes for: the works first, which the site shows and sells; then the
 * projects, the larger works; the exhibitions, which tell where the works were shown; the artist;
 * and the way to reach her last, where every site has it. The header and the footer both list them
 * in this order, including the pages not built yet.
 */
export const menu = [
  { label: "menu.gallery", path: "/gallery" },
  { label: "menu.projects", path: "/projects" },
  { label: "menu.exhibitions", path: "/exhibitions" },
  { label: "menu.about", path: "/about" },
  { label: "menu.contact", path: "/contact" },
] as const satisfies readonly { label: MessageKey; path: string }[];
