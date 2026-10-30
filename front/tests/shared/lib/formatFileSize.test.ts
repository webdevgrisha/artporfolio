import { describe, expect, it } from "vitest";

import { formatFileSize } from "@/shared/lib/formatFileSize";

describe("formatFileSize", () => {
  it.each([
    [0, "0 Б"],
    // Russian groups the thousands with a no-break space.
    [1023, "1\u00a0023 Б"],
    [1024, "1 КБ"],
    [466 * 1024, "466 КБ"],
    [12.4 * 1024 * 1024, "12,4 МБ"],
    [15 * 1024 * 1024, "15 МБ"],
    [1.25 * 1024 ** 3, "1,3 ГБ"],
  ])("formats %d bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it("stays in gigabytes above them", () => {
    expect(formatFileSize(2048 * 1024 ** 3)).toBe("2\u00a0048 ГБ");
  });
});
