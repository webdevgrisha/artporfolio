import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

/** The translation documents by their resource, as `getAll` returns them; none exists by default. */
const translations = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    collection: () => ({ doc: (resource: string) => resource }),
    doc: () => document,
    getAll: (...resources: string[]) =>
      Promise.resolve(
        resources.map((resource) => {
          const data = translations.get(resource);

          return { data: () => data, exists: data !== undefined };
        }),
      ),
  }),
}));
vi.mock("#shared/firebase/storage", () => ({
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

import { getAbout } from "#modules/about/service";

const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

const storedImage = {
  fileName: "photo.png",
  fileSize: 100,
  height: 320,
  originalPath: "about/photo/v/original.png",
  placeholder: "data:image/webp;base64,UklGRg==",
  sources: {
    avif: [{ path: "about/photo/v/640.avif", token: "token", width: 640 }],
    webp: [{ path: "about/photo/v/640.webp", token: "token", width: 640 }],
  },
  version: "v",
  width: 640,
};

function storedAs(fields: Record<string, unknown>) {
  document.get.mockResolvedValue({ get: (field: string) => fields[field] });
}

/** The translations of `resource` into each language, by key, as the translator stores them. */
function translated(resource: string, byLanguage: Record<string, Record<string, string>>) {
  const stored = Object.fromEntries(
    Object.entries(byLanguage).map(([language, texts]) => [
      language,
      Object.fromEntries(
        Object.entries(texts).map(([key, text]) => [key, { edited: false, source: key, text }]),
      ),
    ]),
  );

  translations.set(resource, { failed: false, sources: {}, translations: stored });
}

const processId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  translations.clear();
});

describe("about service", () => {
  it("returns an empty page before anything is saved", async () => {
    storedAs({});

    await expect(getAbout("pl")).resolves.toEqual({
      text: { about: "", biography: "", creation: "" },
      photo: null,
      processPhotos: [],
    });
  });

  it("returns the texts and both kinds of photos from one read", async () => {
    storedAs({
      text,
      photo: { ...storedImage, alt: "Portrait" },
      processPhotos: [{ ...storedImage, alt: "Sketch", id: processId }],
    });

    const about = await getAbout("ru");

    expect(about.text).toEqual(text);
    expect(about.photo).toMatchObject({ alt: "Portrait" });
    expect(about.photo?.sources.avif[0]?.url).toBe(
      "https://storage.test/about/photo/v/640.avif?token=token",
    );
    expect(about.processPhotos).toEqual([
      expect.objectContaining({ alt: "Sketch", id: processId }),
    ]);
    expect(document.get).toHaveBeenCalledTimes(1);
  });

  it("returns the texts and the alt texts in the language asked for", async () => {
    storedAs({
      text,
      photo: { ...storedImage, alt: "Портрет" },
      processPhotos: [{ ...storedImage, alt: "Эскиз", id: processId }],
    });
    translated("about-text", {
      pl: {
        about: "Ilustratorka.",
        biography: "Urodziła się w Mińsku.",
        creation: "Maluje olejem.",
      },
    });
    translated("about-photo", { pl: { alt: "Portret" } });
    translated("about-process-photos", { pl: { [processId]: "Szkic" } });

    const about = await getAbout("pl");

    expect(about.text).toEqual({
      about: "Ilustratorka.",
      biography: "Urodziła się w Mińsku.",
      creation: "Maluje olejem.",
    });
    expect(about.photo).toMatchObject({ alt: "Portret" });
    expect(about.processPhotos).toEqual([expect.objectContaining({ alt: "Szkic", id: processId })]);
  });

  it("returns the English texts while the language has none, and the source without either", async () => {
    storedAs({ text, photo: { ...storedImage, alt: "Портрет" } });
    translated("about-text", { en: { about: "Illustrator." } });
    translated("about-photo", { en: { alt: "Portrait" } });

    const about = await getAbout("de");

    expect(about.text).toEqual({ ...text, about: "Illustrator." });
    expect(about.photo).toMatchObject({ alt: "Portrait" });
  });
});
