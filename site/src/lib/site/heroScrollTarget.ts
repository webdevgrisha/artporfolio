/** Where the visitor is between the hero and the page, in pixels from the top of the document. */
export interface HeroScroll {
  /** Whether the visitor last scrolled down. */
  down: boolean;
  /** The scroll at which the line of the hero is wiped and the hero starts to leave. */
  lineEnd: number;
  /** The scroll at which the hero is gone and the page fills the screen. */
  pageStart: number;
  scroll: number;
}

/**
 * Where the page takes the visitor who stopped between the wiped line and the page, so the hero
 * never stays half gone: on to the page when they scrolled down, back to the hero when they
 * scrolled up. Nowhere when they are at either end, or past them: within the hero or the page.
 * A pixel either side counts as there, as a scroll stops at fractions of one.
 */
export function heroScrollTarget({
  down,
  lineEnd,
  pageStart,
  scroll,
}: HeroScroll): number | undefined {
  if (scroll <= lineEnd + 1 || scroll >= pageStart - 1) return undefined;

  return down ? pageStart : lineEnd;
}
