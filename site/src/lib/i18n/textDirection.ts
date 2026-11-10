import type { Language } from "./languages";

const rightToLeft: ReadonlySet<Language> = new Set(["ar"]);

/** The direction of writing, for `dir` on <html>; the styles follow it with logical properties. */
export function textDirection(language: Language): "ltr" | "rtl" {
  return rightToLeft.has(language) ? "rtl" : "ltr";
}
