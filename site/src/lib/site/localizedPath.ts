import type { Language } from "@/lib/i18n/languages";

/** The path of a page in a language: `/` → `/pl/`, `/contact` → `/pl/contact`. */
export function localizedPath(language: Language, path: string): string {
  return path === "/" ? `/${language}/` : `/${language}${path}`;
}
