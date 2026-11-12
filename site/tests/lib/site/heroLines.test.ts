import { describe, expect, it } from "vitest";

import { heroCopyGap, heroLines } from "@/lib/site/heroLines";

const contact = { name: 5.4, words: [{ letters: 7, width: 5.4 }] };
const artist = {
  name: 10,
  words: [
    { letters: 9, width: 4.9 },
    { letters: 9, width: 4.6 },
  ],
};

describe("heroLines", () => {
  it("puts as few copies on a line as keep the type within a fifth of the height", () => {
    const { copies, fontSize } = heroLines(contact, { height: 900, travel: 0, width: 1312 });

    expect(copies).toBe(2);
    expect(fontSize).toBeLessThanOrEqual(900 / 5);
    expect(fontSize * (2 * contact.name + heroCopyGap)).toBeCloseTo(1312);
  });

  it("keeps one copy on a phone, from edge to edge", () => {
    const { copies, fontSize, wordSpacing } = heroLines(contact, {
      height: 844,
      travel: 0,
      width: 358,
    });

    expect(copies).toBe(1);
    expect(fontSize * contact.name).toBeCloseTo(358);
    expect(wordSpacing).toEqual([]);
  });

  it("keeps a long name whole while it is large enough", () => {
    const { copies, wordSpacing } = heroLines(artist, { height: 1080, travel: 0, width: 1768 });

    expect(copies).toBe(1);
    expect(wordSpacing).toEqual([]);
  });

  it("sets a long name a word per line when it would be small, each word as wide", () => {
    const { fontSize, wordSpacing } = heroLines(artist, { height: 844, travel: 0, width: 358 });

    expect(fontSize * 4.9).toBeCloseTo(358);
    expect(wordSpacing[0]).toBe(0);
    expect(4.6 + 8 * (wordSpacing[1] ?? 0)).toBeCloseTo(4.9);
  });

  it("fills the height with whole lines, and waits above with enough for the travel", () => {
    const { above, lines, pitch } = heroLines(contact, { height: 1080, travel: 500, width: 1768 });

    expect(lines * pitch).toBeCloseTo(1080);
    expect(above * pitch).toBeGreaterThanOrEqual(500);
    expect((above - 1) * pitch).toBeLessThan(500);
  });
});
