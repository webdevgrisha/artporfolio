import { heroScrollTarget } from "@/lib/site/heroScrollTarget";
import { onScrollEnd } from "@/lib/site/onScrollEnd";

/**
 * The hero never stays half gone. As soon as the visitor scrolls on from the wiped line, the page
 * takes them the rest of the way: the hero leaves upwards and the page fills the screen; once they
 * pull up past the top of the page by a fifth of the screen, the whole hero comes back, and a
 * smaller pull springs back to the page. Should the scroll come to rest in between, as when a hand
 * stops the move, the page finishes it.
 */

/** The pull up past the top of the page that brings the hero back, as a share of the screen. */
const resistance = 0.2;

export function finishHeroScroll(hero: HTMLElement, stage: HTMLElement): void {
  let lastScroll = window.scrollY;
  let down = true;
  /** Where the page is taking the visitor, while it is. */
  let target: number | undefined;

  const finish = (resting: boolean): void => {
    // A still hero, with less motion, is no higher than the screen: there is nothing to finish.
    if (hero.offsetHeight <= stage.offsetHeight) return;

    const scroll = window.scrollY;

    if (target !== undefined && Math.abs(scroll - target) < 2) target = undefined;
    if (target !== undefined) return;

    const heroTop = hero.getBoundingClientRect().top + scroll;

    target = heroScrollTarget({
      down,
      lineEnd: heroTop + hero.offsetHeight - window.innerHeight,
      pageStart: heroTop + hero.offsetHeight,
      resistance: window.innerHeight * resistance,
      resting,
      scroll,
    });
    if (target !== undefined) window.scrollTo({ behavior: "smooth", top: target });
  };

  /*
   * Should no scrollend come a while after the last move, the scroll has come to rest all the same:
   * Firefox does not always fire it after a single step of the wheel, and a pull up within the
   * resistance would stay where it was let go.
   */
  let settle = 0;

  const rest = (): void => {
    window.clearTimeout(settle);
    target = undefined;
    finish(true);
  };

  window.addEventListener(
    "scroll",
    () => {
      down = window.scrollY >= lastScroll;
      lastScroll = window.scrollY;
      finish(false);
      window.clearTimeout(settle);
      settle = window.setTimeout(rest, 300);
    },
    { passive: true },
  );

  onScrollEnd(rest);
}
