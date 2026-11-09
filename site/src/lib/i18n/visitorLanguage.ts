import { defaultLanguage, isLanguage, type Language } from "./languages";
import { negotiateLanguage } from "./negotiateLanguage";

interface VisitorLanguageSources {
  /** The language the visitor chose with the switch, from their cookie. */
  chosen: string | undefined;
  /** The `Accept-Language` header of their browser. */
  acceptLanguage: string | null;
}

/**
 * The language to open the site in for a visitor who came to its root: the one they chose, else
 * the best one their browser asks for, else English.
 */
export function visitorLanguage({ acceptLanguage, chosen }: VisitorLanguageSources): Language {
  if (isLanguage(chosen)) return chosen;

  return negotiateLanguage(acceptLanguage) ?? defaultLanguage;
}
