import { describe, expect, it } from "vitest";

import { heroScrollTarget } from "@/lib/site/heroScrollTarget";

const ends = { lineEnd: 800, pageStart: 1600 };

describe("heroScrollTarget", () => {
  it("takes the visitor on to the page when they scrolled down past the wiped line", () => {
    expect(heroScrollTarget({ ...ends, down: true, scroll: 810 })).toBe(1600);
  });

  it("takes the visitor back to the hero when they scrolled up from the page", () => {
    expect(heroScrollTarget({ ...ends, down: false, scroll: 1590 })).toBe(800);
  });

  it("leaves the visitor within the hero, where the line is written and carried", () => {
    expect(heroScrollTarget({ ...ends, down: true, scroll: 300 })).toBeUndefined();
    expect(heroScrollTarget({ ...ends, down: true, scroll: 800 })).toBeUndefined();
  });

  it("leaves the visitor within the page", () => {
    expect(heroScrollTarget({ ...ends, down: false, scroll: 1600 })).toBeUndefined();
    expect(heroScrollTarget({ ...ends, down: false, scroll: 2400 })).toBeUndefined();
  });

  it("counts a pixel either side of an end as there", () => {
    expect(heroScrollTarget({ ...ends, down: true, scroll: 800.6 })).toBeUndefined();
    expect(heroScrollTarget({ ...ends, down: false, scroll: 1599.4 })).toBeUndefined();
  });
});
