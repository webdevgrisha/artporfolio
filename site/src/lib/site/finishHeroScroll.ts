import { heroScrollTarget } from "@/lib/site/heroScrollTarget";
import { onScrollEnd } from "@/lib/site/onScrollEnd";

/**
 * The hero never stays half gone. As soon as the visitor scrolls on from the wiped line, the page
 * takes them the rest of the way: the hero leaves upwards and the page fills the screen; as soon
 * as they scroll back up from the top of the page, the whole hero comes back. Should the scroll
 * come to rest in between, as when a hand stops the move, the page finishes it.
 */
export function finishHeroScroll(hero: HTMLElement, stage: HTMLElement): void {
  let lastScroll = window.scrollY;
  let down = true;
  /** Where the page is taking the visitor, while it is. */
  let target: number | undefined;

  const finish = (): void => {
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
      scroll,
    });
    if (target !== undefined) window.scrollTo({ behavior: "smooth", top: target });
  };

  window.addEventListener(
    "scroll",
    () => {
      down = window.scrollY >= lastScroll;
      lastScroll = window.scrollY;
      finish();
    },
    { passive: true },
  );

  onScrollEnd(() => {
    target = undefined;
    finish();
  });
}
