/**
 * How many letters a text has as a reader sees them, its spaces included: an accented letter or a
 * letter of Hindi written with several code points counts once.
 */
export function graphemeCount(text: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
}
