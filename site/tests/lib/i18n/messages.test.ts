import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { languages } from "@/lib/i18n/languages";
import english from "@/lib/i18n/messages/en.json";

const messagesDirectory = new URL("../../../src/lib/i18n/messages/", import.meta.url);

describe.each(languages.filter((language) => language !== "en"))("messages/%s.json", (language) => {
  it("has a text for each key of English and no other key", async () => {
    const file = new URL(`${language}.json`, messagesDirectory);
    const messages = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;

    expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());
    for (const text of Object.values(messages)) {
      expect(text).toEqual(expect.stringMatching(/\S/));
    }
  });
});
