import { describe, expect, it } from "vitest";

import { emailBreaks } from "@/lib/text/emailBreaks";

describe("emailBreaks", () => {
  it("breaks after the @ and before each dot", () => {
    expect(emailBreaks("anastasia.turkevich@example.com")).toEqual([
      "anastasia",
      ".turkevich@",
      "example",
      ".com",
    ]);
  });

  it("gives back the address when joined", () => {
    const address = "hello@art.studio.example.co.uk";

    expect(emailBreaks(address).join("")).toBe(address);
  });

  it("leaves an address without a dot or an @ whole", () => {
    expect(emailBreaks("hello")).toEqual(["hello"]);
  });
});
