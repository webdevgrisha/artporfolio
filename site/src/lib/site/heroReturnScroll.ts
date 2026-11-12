/**
 * How far through the hero its line stands written at the bottom of the work, just before it is
 * wiped out: the last quarter of the way wipes it (see --wiped in PageHero).
 */
const writtenAlong = 0.75;

/**
 * Where the hero slides back to from the page: where its line stands written at the bottom, not
 * at its end, where the line is wiped out and only the blurred work is left. So the first thing
 * the visitor sees of the hero coming back is the name of the page; scrolling on up plays the line
 * back, and down wipes it and slides to the page again.
 *
 * Takes the scroll at which the hero fills the screen at the top of the page and the scroll at
 * which its end reaches the bottom of the screen, between which its line goes all its way.
 */
export function heroReturnScroll(heroTop: number, heroEnd: number): number {
  return heroTop + (heroEnd - heroTop) * writtenAlong;
}
