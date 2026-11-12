import { describe, expect, it } from "vitest";

import { heroCopyGap, heroLine } from "@/lib/site/heroLine";

const contact = { name: 5.4, words: [{ letters: 7, width: 5.4 }] };
const artist = {
  name: 10,
  words: [
    { letters: 9, width: 4.9 },
    { letters: 9, width: 4.6 },
  ],
};

describe("heroLine", () => {
  it("holds as few copies as keep the type within a fifth of the height, edge to edge", () => {
    const { copies, fontSize } = heroLine(contact, { height: 900, width: 1312 });

    expect(copies).toBe(2);
    expect(fontSize).toBeLessThanOrEqual(900 / 5);
    expect(fontSize * (2 * contact.name + heroCopyGap)).toBeCloseTo(1312);
  });

  it("holds one copy on a phone, from edge to edge", () => {
    const { copies, fontSize, wordSpacing } = heroLine(contact, { height: 844, width: 358 });

    expect(copies).toBe(1);
    expect(fontSize * contact.name).toBeCloseTo(358);
    expect(wordSpacing).toEqual([]);
  });

  it("keeps a long name whole while it is large enough", () => {
    const { copies, wordSpacing } = heroLine(artist, { height: 1080, width: 1768 });

    expect(copies).toBe(1);
    expect(wordSpacing).toEqual([]);
  });

  it("sets a long name word under word when it would be small, each word as wide", () => {
    const { fontSize, wordSpacing } = heroLine(artist, { height: 844, width: 358 });

    expect(fontSize * 4.9).toBeCloseTo(358);
    expect(wordSpacing[0]).toBe(0);
    expect(4.6 + 8 * (wordSpacing[1] ?? 0)).toBeCloseTo(4.9);
  });
});
