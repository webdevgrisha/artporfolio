/**
 * A text with its first letter a capital by the rules of its language, as an item of a list
 * starts: «español» → «Español», «евро» → «Евро». A script without capitals is left as it is.
 */
export function capitalized(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
