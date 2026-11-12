/**
 * The hero never stays half gone: between the wiped line (the end of the hero at the bottom of the
 * screen) and the top of the page, the scroll is taken on to one or the other as soon as it comes
 * to rest, in the direction the visitor moved, as a slide. Within the hero, and within the page,
 * the scroll is free. With less motion the hero is a still screen, and nothing snaps.
 *
 * CSS can snap the scroll too (scroll-snap-type), but browsers disagree on it for a scene taller
 * than the screen (2026): Firefox leaves the scroll between the points, Safari brings the hero
 * back on any pull up. ScrollTrigger of GSAP snaps the same in every browser, by the direction and
 * the speed of the move, with its own easing. It is loaded once the visitor first scrolls, as
 * nothing snaps before: the first screen never waits for it.
 */
export function snapHeroScroll(hero: HTMLElement): void {
  window.addEventListener(
    "scroll",
    () => {
      // Never loaded for a visitor who asked for less motion as the page opened.
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) void snap(hero);
    },
    { once: true, passive: true },
  );
}

async function snap(hero: HTMLElement): Promise<void> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);

  gsap.registerPlugin(ScrollTrigger);
  // The bars of a phone's browser come and go as the visitor scrolls: that is no new layout.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Undone by itself, should the visitor ask for less motion while the page is open.
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    ScrollTrigger.create({
      trigger: hero,
      // From the bottom of the hero at the bottom of the screen to the top of the page at its top.
      start: "bottom bottom",
      end: "bottom top",
      snap: {
        snapTo: [0, 1],
        directional: true,
        delay: 0.05,
        duration: { min: 0.3, max: 0.6 },
        ease: "power2.inOut",
      },
    });
  });
}
