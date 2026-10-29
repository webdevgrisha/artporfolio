import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({ doc: () => document }),
}));

import { getContacts, saveContacts } from "#modules/contacts/service";

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  document.set.mockResolvedValue(undefined);
});

describe("contacts service", () => {
  it("returns empty contacts before they are first saved", async () => {
    document.get.mockResolvedValue({ data: () => undefined });

    await expect(getContacts()).resolves.toEqual({
      email: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    });
  });

  it("reads saved links that today's rules would reject", async () => {
    const older = { ...contacts, linkedin: "linkedin.com/in/artist", youtube: "a".repeat(3_000) };
    document.get.mockResolvedValue({ data: () => older });

    await expect(getContacts()).resolves.toEqual(older);
  });

  it("returns saved contacts without fields the form does not own", async () => {
    document.get.mockResolvedValue({
      data: () => ({ ...contacts, photo: { name: "photo.png" } }),
    });

    await expect(getContacts()).resolves.toEqual(contacts);
  });

  it("returns empty contacts when the document holds only the photo", async () => {
    document.get.mockResolvedValue({ data: () => ({ photo: { name: "photo.png" } }) });

    await expect(getContacts()).resolves.toEqual({
      email: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    });
  });

  it("merges contacts so other fields of the document are kept", async () => {
    await saveContacts(contacts);

    expect(document.set).toHaveBeenCalledWith(contacts, { merge: true });
  });
});
