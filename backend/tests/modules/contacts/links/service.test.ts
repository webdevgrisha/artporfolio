import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#modules/contacts/document", () => ({ contactsDocument: () => document }));

import { getContactLinks, saveContactLinks } from "#modules/contacts/links/service";

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

const emptyLinks = { email: "", instagram: "", linkedin: "", youtube: "" };

/** The contacts document as Firestore returns it. */
function stored(data: Record<string, unknown> | undefined) {
  document.get.mockResolvedValue({ data: () => data, get: (field: string) => data?.[field] });
}

beforeEach(() => {
  vi.clearAllMocks();
  document.set.mockResolvedValue(undefined);
});

describe("contact links service", () => {
  it("returns empty links before they are first saved", async () => {
    stored(undefined);

    await expect(getContactLinks()).resolves.toEqual(emptyLinks);
  });

  it("reads saved links that today's rules would reject", async () => {
    const older = { ...links, linkedin: "linkedin.com/in/artist", youtube: "a".repeat(3_000) };
    stored(older);

    await expect(getContactLinks()).resolves.toEqual(older);
  });

  it("returns empty links when the document holds only the photo", async () => {
    stored({ photo: { alt: "Portrait" } });

    await expect(getContactLinks()).resolves.toEqual(emptyLinks);
  });

  it("merges the links so the photo in the same document is kept", async () => {
    await saveContactLinks(links);

    expect(document.set).toHaveBeenCalledWith(links, { merge: true });
  });
});
