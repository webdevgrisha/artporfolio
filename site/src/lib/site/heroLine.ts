/** The measures of the name of a page, in ems of the font of the hero: its widths at a size of 1. */
export interface HeroName {
  /** The width of the whole name, its spaces included. */
  name: number;
  /** The width of each word of the name and the number of its letters, in the order of the name. */
  words: readonly { letters: number; width: number }[];
}

/** The size of the hero, in pixels: the line spans its width. */
export interface HeroBox {
  height: number;
  width: number;
}

/** How the name fills the line of the hero: how many times, at what size. */
export interface HeroLine {
  /** How many times the line holds the whole name; 1 when it holds a word under another. */
  copies: number;
  /** The size of the type, in pixels. */
  fontSize: number;
  /**
   * When the line holds the words of the name one under another: the letter spacing of each word,
   * in ems, that stretches it to the width of the longest. Empty when it holds the whole name.
   */
  wordSpacing: readonly number[];
}

/** The space between two copies of the name on the line, in ems: a little wider than a space. */
export const heroCopyGap = 0.5;

/** The type is at most this share of the height of the hero, so the line stays a line. */
const largestShare = 1 / 5;

/**
 * Fills the width of the hero with the name of the page from edge to edge: as few copies of it as
 * keep the type within a fifth of the height, sized for them to end exactly at the edges. Two
 * copies of CONTACT on a wide screen, one on a phone. A name of several words that would come out
 * less than half as large has its words one under another instead, each spaced out to the width
 * of the longest, as the name of the artist on a phone.
 */
export function heroLine(name: HeroName, box: HeroBox): HeroLine {
  const largest = box.height * largestShare;
  const nameSize = (copies: number) =>
    box.width / (copies * name.name + (copies - 1) * heroCopyGap);
  const longest = Math.max(...name.words.map((word) => word.width));
  const wordSize = box.width / longest;

  let copies = 1;
  while (nameSize(copies) > largest) copies++;

  const byWord =
    copies === 1 && name.words.length > 1 && nameSize(1) < largest / 2 && wordSize <= largest;

  return {
    copies,
    fontSize: byWord ? wordSize : nameSize(copies),
    wordSpacing: byWord
      ? name.words.map((word) =>
          word.letters > 1 ? (longest - word.width) / (word.letters - 1) : 0,
        )
      : [],
  };
}
