import { describe, expect, it } from "vitest";

import english from "@/lib/i18n/messages/en.json";
import { t } from "@/lib/i18n/translate";

describe("t", () => {
  it("gives a text of the interface in English", () => {
    expect(t("en", "layout.skipToContent")).toBe(english["layout.skipToContent"]);
  });

  it("gives a text in another language from its own file", () => {
    expect(t("ru", "layout.skipToContent")).not.toBe(english["layout.skipToContent"]);
  });
});
