import { heroReturnScroll } from "@/lib/site/heroReturnScroll";

/**
 * The hero never stays half gone. As soon as the visitor scrolls on past the wiped line (the end of
 * the hero at the bottom of the screen), the page slides in at once and fills the screen. Back up
 * from the top of the page, the whole hero slides back once the visitor means it: they pulled up
 * far enough, or flicked up fast; it comes back with its line written (heroReturnScroll); a smaller, slower pull, as of an unsure hand or to read the top
 * of the page, slides back to the page as soon as the scroll rests. Within the hero, and within
 * the page, the scroll is free. With less motion the hero is a still screen, and nothing slides.
 *
 * CSS can snap the scroll (scroll-snap-type), but only once it comes to rest, and browsers disagree
 * on it for a scene taller than the screen (2026). GSAP does what slides of sections do on the web:
 * ScrollTrigger sees the scroll cross either edge, ScrollToPlugin takes it to the other, and while
 * it does, the wheel and the finger wait (ScrollTrigger.observe), so their own momentum never
 * fights the slide. It is loaded once the visitor first scrolls, as nothing slides before: the
 * first screen never waits for it.
 */
export function snapHeroScroll(hero: HTMLElement): void {
  window.addEventListener(
    "scroll",
    () => {
      // Never loaded for a visitor who asked for less motion as the page opened.
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) void slide(hero);
    },
    { once: true, passive: true },
  );
}

/** How far up past the top of the page brings the hero back, as a share of the screen. */
const returnPull = 0.15;

/** How fast a flick up brings the hero back however short it is, in pixels a second. */
const returnSpeed = 1500;

async function slide(hero: HTMLElement): Promise<void> {
  const [{ gsap }, { ScrollTrigger }, { ScrollToPlugin }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/ScrollToPlugin"),
  ]);

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  // The bars of a phone's browser come and go as the visitor scrolls: that is no new layout.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Undone by itself, should the visitor ask for less motion while the page is open.
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    // Holds the wheel, the finger and the keys of scrolling while the page slides.
    const hold = ScrollTrigger.observe({
      type: "wheel,touch,scroll",
      preventDefault: true,
      allowClicks: true,
    });

    hold.disable();

    let sliding = false;

    /*
     * Takes the scroll to an edge, the hero's end or the page's top. The slide carries on the move
     * of the visitor: it starts at its full speed and slows down to the edge, never from a
     * standstill, which after a quick flick looks like a stop and a new start. The less of the way
     * is left, the sooner it is there.
     */
    const slideTo = (edge: number, way: number): void => {
      const root = document.documentElement;

      sliding = true;
      hold.enable();
      // Each step of the slide is a scroll of its own: a smooth one, as the page has for links
      // within it (base.css), would start over at every step and hardly move.
      root.style.scrollBehavior = "auto";
      gsap.to(window, {
        duration: 0.4 + (0.4 * Math.abs(edge - window.scrollY)) / way,
        ease: "power3.out",
        onComplete: () => {
          root.style.removeProperty("scroll-behavior");
          hold.disable();
          sliding = false;
        },
        overwrite: true,
        scrollTo: { autoKill: false, y: edge },
      });
    };

    const between = ScrollTrigger.create({
      trigger: hero,
      // From the bottom of the hero at the bottom of the screen to the top of the page at its top.
      start: "bottom bottom",
      end: "bottom top",
      // Whenever the scroll moves between the two, even from an edge it rests exactly on.
      onUpdate: (self) => {
        if (sliding || self.progress === 0 || self.progress === 1) return;

        const way = self.end - self.start;

        if (self.direction > 0) {
          slideTo(self.end, way);

          return;
        }

        const pulled = (self.end - window.scrollY) / window.innerHeight;

        if (pulled >= returnPull || self.getVelocity() <= -returnSpeed) {
          const heroTop = hero.getBoundingClientRect().top + window.scrollY;
          const back = heroReturnScroll(heroTop, self.start);

          slideTo(back, self.end - back);
        }
      },
    });

    // A pull up too small to bring the hero back is let go of once the scroll rests.
    const letGo = (): void => {
      const { end, start } = between;

      if (!sliding && window.scrollY > start && window.scrollY < end) slideTo(end, end - start);
    };

    ScrollTrigger.addEventListener("scrollEnd", letGo);

    return () => {
      ScrollTrigger.removeEventListener("scrollEnd", letGo);
      hold.kill();
    };
  });
}
