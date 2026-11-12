import { describe, expect, it } from "vitest";

import { capitalized } from "@/lib/text/capitalized";

describe("capitalized", () => {
  it("makes the first letter a capital by the rules of the language", () => {
    expect(capitalized("español", "es")).toBe("Español");
    expect(capitalized("italiano", "tr")).toBe("İtaliano");
  });

  it("leaves a script without capitals as it is", () => {
    expect(capitalized("中文", "zh-Hans")).toBe("中文");
  });
});
