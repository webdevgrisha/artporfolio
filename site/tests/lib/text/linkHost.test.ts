import { describe, expect, it } from "vitest";

import { linkHost } from "@/lib/text/linkHost";

describe("linkHost", () => {
  it("gives the site of the link, without www", () => {
    expect(linkHost("https://www.elephant.com/book?page=2")).toBe("elephant.com");
    expect(linkHost("http://studio.example.org")).toBe("studio.example.org");
  });
});
