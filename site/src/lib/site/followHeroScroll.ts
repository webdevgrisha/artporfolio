/**
 * Stands in for the scroll-driven animation of --along in Safari before 26, which cannot tie an
 * animation to the scroll: the same progress through the hero, set on the line and hint as the
 * visitor scrolls. Does nothing where the browser can. Remove once those are gone.
 */
export function followHeroScroll(hero: HTMLElement): void {
  if (CSS.supports("animation-timeline: view()")) return;

  const moving = hero.querySelectorAll<HTMLElement>(".stage > .line, .stage > .hint");
  let frame = 0;
  let previous = "";
  const follow = (): void => {
    frame = 0;

    const travel = hero.offsetHeight - window.innerHeight;
    const along = travel > 0 ? -hero.getBoundingClientRect().top / travel : 0;

    const progress = `${Math.min(Math.max(along, 0), 1)}`;

    if (progress === previous) return;

    for (const element of moving) element.style.setProperty("--along", progress);
    previous = progress;
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
