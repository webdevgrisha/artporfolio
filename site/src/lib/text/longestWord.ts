/**
 * How many letters the longest word of a text has, so a heading set word by word can be sized for
 * that word to fill its line. Letters as a reader sees them: an accented letter or a letter of
 * Hindi written with several code points counts once.
 */
export function longestWordLength(text: string): number {
  const letters = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  return Math.max(0, ...text.split(/\s+/u).map((word) => [...letters.segment(word)].length));
}
