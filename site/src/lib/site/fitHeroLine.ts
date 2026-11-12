import { type HeroName, heroLine } from "@/lib/site/heroLine";

/** The size of type the name is measured at, in pixels, large for the measures to be precise. */
const probeSize = 100;

/**
 * Fills the width of the line of the hero with the name of the page, in the copies or words and at
 * the size heroLine gives, whenever the hero changes size, and tells the CSS how high the line
 * came out, to move it by. The CSS cannot fit text to a width by itself.
 */
export function fitHeroLine(hero: HTMLElement, stage: HTMLElement, line: HTMLElement): void {
  const name = line.dataset.name ?? "";
  // Words joined by a no-break space stay together, as everywhere on the site.
  const words = name.split(/[^\S  ]+/u).filter(Boolean);
  const letters = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  /** The width of a text in the type of the line, in ems. */
  const measure = (text: string): number => {
    const probe = document.createElement("span");

    probe.className = "probe";
    probe.style.fontSize = `${probeSize}px`;
    probe.textContent = text;
    line.append(probe);

    const width = probe.getBoundingClientRect().width / probeSize;

    probe.remove();

    return width;
  };

  const copy = (text: string, spacing = 0): HTMLElement => {
    const element = document.createElement("span");

    element.className = "copy";
    element.textContent = text;
    if (spacing) element.style.letterSpacing = `${spacing}em`;

    return element;
  };

  const layOut = (measures: HeroName): void => {
    const style = getComputedStyle(line);
    const fit = heroLine(measures, {
      height: stage.clientHeight,
      width:
        line.clientWidth -
        Number.parseFloat(style.paddingInlineStart) -
        Number.parseFloat(style.paddingInlineEnd),
    });
    const byWord = fit.wordSpacing.length > 0;

    line.toggleAttribute("data-by-word", byWord);
    line.replaceChildren(
      ...(byWord
        ? words.map((word, index) => copy(word, fit.wordSpacing[index]))
        : Array.from({ length: fit.copies }, () => copy(name))),
    );
    line.style.setProperty("--line-size", `${fit.fontSize}px`);
    line.style.setProperty("--line-height", `${line.offsetHeight}px`);
  };

  // Measured once the fonts of the name have come: the fallback is narrower or wider.
  void document.fonts.ready.then(() => {
    const measures: HeroName = {
      name: measure(name),
      words: words.map((word) => ({
        letters: [...letters.segment(word)].length,
        width: measure(word),
      })),
    };

    new ResizeObserver(() => layOut(measures)).observe(hero);
  });
}
