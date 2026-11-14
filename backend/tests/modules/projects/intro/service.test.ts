import { beforeEach, describe, expect, it, vi } from "vitest";

/** The saved fields of the document, or none before the first save. */
const saved = vi.hoisted(() => ({ fields: undefined as Record<string, unknown> | undefined }));

/** The translation documents by their resource; none exists by default. */
const translations = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    collection: () => ({
      doc: (resource: string) => ({
        get: async () => {
          const data = translations.get(resource);

          return { data: () => data, exists: data !== undefined };
        },
      }),
    }),
    doc: () => ({ get: async () => ({ data: () => saved.fields }) }),
  }),
}));

import { getProjectsIntro } from "#modules/projects/intro/service";
import { entityTag } from "#shared/http/etag";

const text = "Проекты художницы.";

function translated(byLanguage: Record<string, string>) {
  const stored = Object.fromEntries(
    Object.entries(byLanguage).map(([language, translation]) => [
      language,
      { text: { edited: false, source: text, text: translation } },
    ]),
  );

  translations.set("projects-intro", { failed: false, sources: {}, translations: stored });
}

beforeEach(() => {
  saved.fields = { text };
  translations.clear();
});

describe("getProjectsIntro", () => {
  it("gives the saved text in the source language, with the tag a change sends in If-Match", async () => {
    translated({ en: "Projects of the artist." });

    await expect(getProjectsIntro("ru")).resolves.toEqual({
      data: { text },
      etag: entityTag({ text }),
    });
  });

  it("gives the text in the language asked, else in English, else as saved", async () => {
    translated({ de: "Projekte der Künstlerin.", en: "Projects of the artist." });

    expect((await getProjectsIntro("de")).data.text).toBe("Projekte der Künstlerin.");
    expect((await getProjectsIntro("pl")).data.text).toBe("Projects of the artist.");

    translations.clear();

    expect((await getProjectsIntro("pl")).data.text).toBe(text);
  });

  it("gives an empty text before the first save", async () => {
    saved.fields = undefined;

    expect((await getProjectsIntro("de")).data).toEqual({ text: "" });
  });
});
