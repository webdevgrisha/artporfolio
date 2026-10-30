import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({ doc: () => document }),
}));
vi.mock("#shared/firebase/storage", () => ({
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

import { getContacts, saveContacts } from "#modules/contacts/service";
import { apiImage } from "../../support/images.js";

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

const emptyContacts = { email: "", instagram: "", linkedin: "", youtube: "" };

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
  document.set.mockResolvedValue(undefined);
});

describe("contacts service", () => {
  it("returns empty contacts and no photo before they are first saved", async () => {
    stored(undefined);

    await expect(getContacts()).resolves.toEqual({ contacts: emptyContacts, photo: null });
  });

  it("reads saved links that today's rules would reject", async () => {
    const older = { ...contacts, linkedin: "linkedin.com/in/artist", youtube: "a".repeat(3_000) };
    stored(older);

    await expect(getContacts()).resolves.toEqual({ contacts: older, photo: null });
  });

  it("returns the links and the photo from one read of the document", async () => {
    stored({ ...contacts, photo: storedPhoto });

    await expect(getContacts()).resolves.toEqual({
      contacts,
      photo: { ...apiImage("photo.png"), alt: "Portrait" },
    });
    expect(document.get).toHaveBeenCalledOnce();
  });

  it("returns empty contacts when the document holds only the photo", async () => {
    stored({ photo: storedPhoto });

    await expect(getContacts()).resolves.toMatchObject({ contacts: emptyContacts });
  });

  it("merges contacts so other fields of the document are kept", async () => {
    await saveContacts(contacts);

    expect(document.set).toHaveBeenCalledWith(contacts, { merge: true });
  });
});
