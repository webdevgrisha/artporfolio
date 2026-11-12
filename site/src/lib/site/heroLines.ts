/** The measures of the name of a page, in ems of the font of the hero: its widths at a size of 1. */
export interface HeroName {
  /** The width of the whole name, its spaces included. */
  name: number;
  /** The width of each word of the name and the number of its letters, in the order of the name. */
  words: readonly { letters: number; width: number }[];
}

/** The box the lines fill, in pixels. */
export interface HeroBox {
  /** How far the lines travel down as the visitor scrolls, in pixels: lines wait above for it. */
  travel: number;
  height: number;
  width: number;
}

/** How the name fills the hero: what each line holds, at what size, and how many lines. */
export interface HeroLines {
  /** How many lines wait above the hero, to come down into it as the visitor scrolls. */
  above: number;
  /** How many times each line holds the whole name; 1 when the lines hold one word each. */
  copies: number;
  /** The size of the type, in pixels. */
  fontSize: number;
  /** How many lines fill the hero. */
  lines: number;
  /** The height of a line, in pixels: the lines fill the hero exactly. */
  pitch: number;
  /**
   * When the lines hold a word each, in turn: the letter spacing of each word, in ems, that
   * stretches it to the width of the longest. Empty when every line holds the whole name.
   */
  wordSpacing: readonly number[];
}

/** The space between two copies of the name on a line, in ems: a little wider than a space. */
export const heroCopyGap = 0.5;

/** The height of a line for its type, about as far apart as in the mockup. */
const heroLineHeight = 1.5;

/** The type is at most this share of the height of the hero: five lines on a screen at the least. */
const largestShare = 1 / 5;

/**
 * Fills the width of the hero with the name of the page from edge to edge: as few copies of it on
 * a line as keep the type within a fifth of the height, sized for them to end exactly at the
 * edges. Two copies of CONTACT on a wide screen, one on a phone. A name of several words that
 * would come out less than half as large gets a word per line instead, each spaced out to the
 * width of the longest, as the name of the artist on a phone. Lines fill the height evenly.
 */
export function heroLines(name: HeroName, box: HeroBox): HeroLines {
  const largest = box.height * largestShare;
  const nameSize = (copies: number) =>
    box.width / (copies * name.name + (copies - 1) * heroCopyGap);
  const longest = Math.max(...name.words.map((word) => word.width));
  const wordSize = box.width / longest;

  let copies = 1;
  while (nameSize(copies) > largest) copies++;

  const byWord =
    copies === 1 && name.words.length > 1 && nameSize(1) < largest / 2 && wordSize <= largest;
  const fontSize = byWord ? wordSize : nameSize(copies);
  const lines = Math.max(1, Math.round(box.height / (fontSize * heroLineHeight)));
  const pitch = box.height / lines;

  return {
    above: Math.ceil(box.travel / pitch),
    copies,
    fontSize,
    lines,
    pitch,
    wordSpacing: byWord
      ? name.words.map((word) =>
          word.letters > 1 ? (longest - word.width) / (word.letters - 1) : 0,
        )
      : [],
  };
}
