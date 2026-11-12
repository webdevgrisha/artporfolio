/**
 * Stands in for the scroll-driven animation of --along in Safari before 26, which cannot tie an
 * animation to the scroll: the same progress through the hero, set as the visitor scrolls. Does
 * nothing where the browser can. Remove once those are gone.
 */
export function followHeroScroll(hero: HTMLElement): void {
  if (CSS.supports("animation-timeline: view()")) return;

  let frame = 0;
  const follow = (): void => {
    frame = 0;

    const travel = hero.offsetHeight - window.innerHeight;
    const along = travel > 0 ? -hero.getBoundingClientRect().top / travel : 0;

    hero.style.setProperty("--along", `${Math.min(Math.max(along, 0), 1)}`);
  };

  follow();
  window.addEventListener(
    "scroll",
    () => {
      if (frame === 0) frame = requestAnimationFrame(follow);
    },
    { passive: true },
  );
}
