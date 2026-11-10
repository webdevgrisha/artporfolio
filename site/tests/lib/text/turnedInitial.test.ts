import { describe, expect, it } from "vitest";

import { splitTurnedInitial } from "@/lib/text/turnedInitial";

describe("splitTurnedInitial", () => {
  it("turns the G a text starts with", () => {
    expect(splitTurnedInitial("Get in touch")).toEqual({ initial: "G", rest: "et in touch" });
  });

  it("keeps any other first letter", () => {
    expect(splitTurnedInitial("Napisz do mnie")).toBeUndefined();
    expect(splitTurnedInitial("Свяжитесь со мной")).toBeUndefined();
  });
});
