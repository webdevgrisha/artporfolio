import { describe, expect, it } from "vitest";

import { srcset } from "@/lib/images/srcset";

describe("srcset", () => {
  it("names each file by its width", () => {
    const files = [
      { url: "https://cdn.test/320.avif", width: 320 },
      { url: "https://cdn.test/640.avif", width: 640 },
    ];

    expect(srcset(files)).toBe("https://cdn.test/320.avif 320w, https://cdn.test/640.avif 640w");
  });
});
