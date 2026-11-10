import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const translationsDocument = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    collection: () => ({ doc: () => translationsDocument }),
    doc: () => document,
  }),
}));
vi.mock("#shared/firebase/storage", () => ({
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

import { getContacts } from "#modules/contacts/service";
import { apiImage } from "../../support/images.js";

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

const emptyLinks = { email: "", instagram: "", linkedin: "", youtube: "" };

const storedPhoto = {
  alt: "Портрет",
  fileName: "photo.png",
  fileSize: 466_000,
  height: 640,
  originalPath: "image/original.png",
  sources: {
    avif: [{ path: "image/960.avif", token: "token", width: 960 }],
    webp: [{ path: "image/960.webp", token: "token", width: 960 }],
  },
  version: "version",
  width: 960,
};

/** The contacts document as Firestore returns it. */
function stored(data: Record<string, unknown> | undefined) {
  document.get.mockResolvedValue({ data: () => data, get: (field: string) => data?.[field] });
}

/** The translations of the alt text as Firestore returns them. */
function translated(translations: Record<string, { alt: string }>) {
  const stored = Object.fromEntries(
    Object.entries(translations).map(([language, { alt }]) => [
      language,
      { alt: { edited: false, source: "Портрет", text: alt } },
    ]),
  );

  translationsDocument.get.mockResolvedValue({
    data: () => ({ failed: false, sources: { alt: "Портрет" }, translations: stored }),
    exists: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contacts service", () => {
  it("returns empty links and no photo before they are first saved", async () => {
    stored(undefined);

    await expect(getContacts("ru")).resolves.toEqual({ links: emptyLinks, photo: null });
  });

  it("returns the links and the photo from one read of the document", async () => {
    stored({ links, photo: storedPhoto });

    await expect(getContacts("ru")).resolves.toEqual({
      links,
      photo: { ...apiImage("photo.png"), alt: "Портрет" },
    });
    expect(document.get).toHaveBeenCalledOnce();
    expect(translationsDocument.get).not.toHaveBeenCalled();
  });

  it("returns the alt text in the language asked for", async () => {
    stored({ links, photo: storedPhoto });
    translated({ en: { alt: "Portrait" }, pl: { alt: "Portret" } });

    await expect(getContacts("pl")).resolves.toMatchObject({ photo: { alt: "Portret" } });
  });

  it("returns the English alt text while the language has none", async () => {
    stored({ links, photo: storedPhoto });
    translated({ en: { alt: "Portrait" } });

    await expect(getContacts("de")).resolves.toMatchObject({ photo: { alt: "Portrait" } });
  });
});
