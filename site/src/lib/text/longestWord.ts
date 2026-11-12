/**
 * How many letters the longest word of a text has, so a heading set word by word can be sized for
 * that word to fill its line. Letters as a reader sees them: an accented letter or a letter of
 * Hindi written with several code points counts once. Words joined by a no-break space, such as
 * a short preposition and the word after it, stay on one line, so they count as one word.
 */
export function longestWordLength(text: string): number {
  const letters = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  return Math.max(
    0,
    ...text.split(/[^\S\u00A0\u202F]+/u).map((word) => [...letters.segment(word)].length),
  );
}
