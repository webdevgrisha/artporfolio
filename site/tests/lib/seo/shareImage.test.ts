import { describe, expect, it } from "vitest";

import type { Image } from "@/lib/api/image";
import { shareImage } from "@/lib/seo/shareImage";

function file(width: number) {
  return { url: `https://files.test/${String(width)}.webp`, width };
}

function image([first, ...rest]: [number, ...number[]]): Image {
  return {
    height: 1_280,
    placeholder: "data:image/webp;base64,UklGRg==",
    sources: { avif: [file(first)], webp: [file(first), ...rest.map(file)] },
    width: 1_920,
  };
}

describe("shareImage", () => {
  it("takes the narrowest file as wide as a card, with the height of its shape", () => {
    expect(shareImage(image([320, 640, 960, 1_280, 1_920]))).toEqual({
      height: 853,
      url: "https://files.test/1280.webp",
      width: 1_280,
    });
  });

  it("takes the widest file of a smaller image", () => {
    expect(shareImage(image([320, 640, 800]))).toMatchObject({
      url: "https://files.test/800.webp",
      width: 800,
    });
  });
});
