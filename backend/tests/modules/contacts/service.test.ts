import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({ doc: () => document }),
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
  alt: "Portrait",
  fileName: "photo.png",
  fileSize: 466_000,
  height: 640,
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contacts service", () => {
  it("returns empty links and no photo before they are first saved", async () => {
    stored(undefined);

    await expect(getContacts()).resolves.toEqual({ links: emptyLinks, photo: null });
  });

  it("returns the links and the photo from one read of the document", async () => {
    stored({ ...links, photo: storedPhoto });

    await expect(getContacts()).resolves.toEqual({
      links,
      photo: { ...apiImage("photo.png"), alt: "Portrait" },
    });
    expect(document.get).toHaveBeenCalledOnce();
  });
});
