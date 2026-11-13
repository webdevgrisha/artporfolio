/** About as long as search results show a description before they cut it themselves. */
const defaultMaxLength = 160;

/**
 * A text of the page made into its description for search results and link cards: on one line,
 * and when it is longer than `maxLength`, cut after its last whole word that fits, with an
 * ellipsis. Words as the language has them, so a text in Chinese or Japanese, which has no spaces,
 * is cut between its words too.
 */
export function summary(text: string, maxLength = defaultMaxLength): string {
  const line = text.replace(/\s+/gu, " ").trim();

  if (line.length <= maxLength) return line;

  const words = new Intl.Segmenter(undefined, { granularity: "word" });
  let end = 0;

  // One place is left for the ellipsis.
  for (const { index, segment } of words.segment(line)) {
    if (index + segment.length > maxLength - 1) break;
    end = index + segment.length;
  }

  // A sentence cut short ends on its word, not on the space or the comma after it.
  return `${line.slice(0, end).replace(/[\s\p{P}]+$/u, "")}…`;
}
