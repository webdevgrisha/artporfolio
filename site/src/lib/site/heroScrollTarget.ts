/** Where the visitor is between the hero and the page, in pixels from the top of the document. */
export interface HeroScroll {
  /** Whether the visitor last scrolled down. */
  down: boolean;
  /** The scroll at which the line of the hero is wiped and the hero starts to leave. */
  lineEnd: number;
  /** The scroll at which the hero is gone and the page fills the screen. */
  pageStart: number;
  /**
   * How far up past the top of the page the visitor must scroll for the hero to come back, in
   * pixels: a smaller pull up is let go of, and the page springs back to its top.
   */
  resistance: number;
  /** Whether the scroll has come to rest, rather than still moving. */
  resting: boolean;
  scroll: number;
}

/**
 * Where the page takes the visitor between the wiped line and the page, so the hero never stays
 * half gone. Scrolling down, on to the page. Scrolling up from the page, back to the hero only once
 * they have pulled past the resistance, as a small or chance scroll up, to read the top of the
 * page, should not throw a whole screen back at them: while they pull less, the page follows their
 * hand, and once they let go it springs back to its top. Nowhere when they are at either end, or
 * past them: within the hero or the page. A pixel either side counts as there, as a scroll stops at
 * fractions of one.
 */
export function heroScrollTarget({
  down,
  lineEnd,
  pageStart,
  resistance,
  resting,
  scroll,
}: HeroScroll): number | undefined {
  if (scroll <= lineEnd + 1 || scroll >= pageStart - 1) return undefined;
  if (down) return pageStart;
  if (pageStart - scroll < resistance) return resting ? pageStart : undefined;

  return lineEnd;
}
