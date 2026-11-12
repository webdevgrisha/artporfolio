import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const translationsDocument = vi.hoisted(() => ({
  get: vi.fn(),
}));

const gallery = vi.hoisted(() => ({
  landscapeWorkPhotos: vi.fn(),
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
vi.mock("#modules/gallery/works/landscape-photos", () => gallery);

import { getContacts } from "#modules/contacts/service";
import { apiImage } from "../../support/images.js";

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

const emptyLinks = { email: "", instagram: "", linkedin: "", youtube: "" };

const photoId = "11111111-1111-4111-8111-111111111111";

const storedPhoto = {
  alt: "Портрет",
  fileName: "photo.png",
  fileSize: 466_000,
  height: 640,
  id: photoId,
  originalPath: "image/original.png",
  sources: {
    avif: [{ path: "image/960.avif", token: "token", width: 960 }],
    webp: [{ path: "image/960.webp", token: "token", width: 960 }],
  },
  version: "version",
  width: 960,
};

const workPhoto = { ...apiImage("work.png"), alt: "Work" };

/** The contacts document as Firestore returns it. */
function stored(data: Record<string, unknown> | undefined) {
  document.get.mockResolvedValue({ data: () => data, get: (field: string) => data?.[field] });
}

/** The translations of the alt texts of the uploaded photos as Firestore returns them. */
function translated(translations: Record<string, string>) {
  const stored = Object.fromEntries(
    Object.entries(translations).map(([language, alt]) => [
      language,
      { [photoId]: { edited: false, source: "Портрет", text: alt } },
    ]),
  );

  translationsDocument.get.mockResolvedValue({
    data: () => ({ failed: false, sources: { [photoId]: "Портрет" }, translations: stored }),
    exists: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  gallery.landscapeWorkPhotos.mockResolvedValue([workPhoto]);
});

describe("contacts service", () => {
  it("returns empty links and no photos before they are first saved", async () => {
    stored(undefined);

    await expect(getContacts("pl")).resolves.toEqual({ links: emptyLinks, photos: [] });
    expect(translationsDocument.get).not.toHaveBeenCalled();
    expect(gallery.landscapeWorkPhotos).not.toHaveBeenCalled();
  });

  it("returns the links and the uploaded photos from one read of the document", async () => {
    stored({ links, slideshow: { photos: [storedPhoto], source: "uploaded" } });

    await expect(getContacts("ru")).resolves.toEqual({
      links,
      photos: [{ ...apiImage("photo.png"), alt: "Портрет" }],
    });
    expect(document.get).toHaveBeenCalledOnce();
    expect(translationsDocument.get).not.toHaveBeenCalled();
  });

  it("returns the alt texts of the uploaded photos in the language asked for", async () => {
    stored({ links, slideshow: { photos: [storedPhoto], source: "uploaded" } });
    translated({ en: "Portrait", pl: "Portret" });

    await expect(getContacts("pl")).resolves.toMatchObject({ photos: [{ alt: "Portret" }] });
  });

  it("returns the English alt texts while the language has none", async () => {
    stored({ links, slideshow: { photos: [storedPhoto], source: "uploaded" } });
    translated({ en: "Portrait" });

    await expect(getContacts("de")).resolves.toMatchObject({ photos: [{ alt: "Portrait" }] });
  });

  it("returns the photos of the gallery in place of the uploaded ones", async () => {
    stored({ links, slideshow: { photos: [storedPhoto], source: "gallery" } });

    await expect(getContacts("pl")).resolves.toEqual({ links, photos: [workPhoto] });
    expect(gallery.landscapeWorkPhotos).toHaveBeenCalledWith("pl");
    expect(translationsDocument.get).not.toHaveBeenCalled();
  });
});
