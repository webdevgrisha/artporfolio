/**
 * The heading of the Contacts page draws its first letter, a capital G, upside down. Only a G is
 * turned: in the languages whose heading starts with another letter it stays as it is, as most
 * letters upside down read as other letters (an «N» as a «И» turned, an «M» as a «W»).
 *
 * Returns the letter to turn and the rest of the text, or nothing when the text keeps its first
 * letter. The letters stay one word, so screen readers and search engines read the text as is.
 */
export function splitTurnedInitial(text: string): { initial: string; rest: string } | undefined {
  return /^[Gg]/.test(text) ? { initial: text.charAt(0), rest: text.slice(1) } : undefined;
}
