import { describe, expect, it } from "vitest";

import { heroScrollTarget } from "@/lib/site/heroScrollTarget";

const ends = { lineEnd: 800, pageStart: 1600, resistance: 160 };
const moving = { ...ends, resting: false };
const resting = { ...ends, resting: true };

describe("heroScrollTarget", () => {
  it("takes the visitor on to the page when they scrolled down past the wiped line", () => {
    expect(heroScrollTarget({ ...moving, down: true, scroll: 810 })).toBe(1600);
    expect(heroScrollTarget({ ...resting, down: true, scroll: 810 })).toBe(1600);
  });

  it("takes the visitor back to the hero once they pulled up past the resistance", () => {
    expect(heroScrollTarget({ ...moving, down: false, scroll: 1400 })).toBe(800);
    expect(heroScrollTarget({ ...resting, down: false, scroll: 1400 })).toBe(800);
  });

  it("follows a smaller pull up while it moves, and springs back to the page once it rests", () => {
    expect(heroScrollTarget({ ...moving, down: false, scroll: 1500 })).toBeUndefined();
    expect(heroScrollTarget({ ...resting, down: false, scroll: 1500 })).toBe(1600);
  });

  it("takes the visitor on to the page when they scroll down again within the resistance", () => {
    expect(heroScrollTarget({ ...moving, down: true, scroll: 1500 })).toBe(1600);
  });

  it("leaves the visitor within the hero, where the line is written and carried", () => {
    expect(heroScrollTarget({ ...moving, down: true, scroll: 300 })).toBeUndefined();
    expect(heroScrollTarget({ ...resting, down: false, scroll: 800 })).toBeUndefined();
  });

  it("leaves the visitor within the page", () => {
    expect(heroScrollTarget({ ...resting, down: false, scroll: 1600 })).toBeUndefined();
    expect(heroScrollTarget({ ...moving, down: false, scroll: 2400 })).toBeUndefined();
  });

  it("counts a pixel either side of an end as there", () => {
    expect(heroScrollTarget({ ...moving, down: true, scroll: 800.6 })).toBeUndefined();
    expect(heroScrollTarget({ ...resting, down: false, scroll: 1599.4 })).toBeUndefined();
  });
});
