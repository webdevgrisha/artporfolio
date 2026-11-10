import type { MessageKey } from "@/lib/i18n/translate";

/**
 * The pages of the menu of the site, in its order, by their path under a language and the key of
 * their name. It lists every page of the mockup, including those not built yet.
 */
export const menu = [
  { label: "menu.gallery", path: "/gallery" },
  { label: "menu.process", path: "/process" },
  { label: "menu.projects", path: "/projects" },
  { label: "menu.about", path: "/about" },
  { label: "menu.contact", path: "/contact" },
] as const satisfies readonly { label: MessageKey; path: string }[];
