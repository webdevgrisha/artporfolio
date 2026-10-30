import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#modules/contacts/document", () => ({ contactsDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));

import { getContactLinks, replaceContactLinks } from "#modules/contacts/links/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

const emptyLinks = { email: "", instagram: "", linkedin: "", youtube: "" };

/** The contacts document as Firestore returns it. */
function snapshotWith(data: Record<string, unknown> | undefined) {
  return { data: () => data, get: (field: string) => data?.[field] };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotWith(undefined));
  transaction.get.mockResolvedValue(snapshotWith(undefined));
});

describe("getContactLinks", () => {
  it("returns empty links before they are first saved", async () => {
    await expect(getContactLinks()).resolves.toEqual({
      data: emptyLinks,
      etag: entityTag(emptyLinks),
    });
  });

  it("reads saved links that today's rules would reject", async () => {
    const older = { ...links, linkedin: "linkedin.com/in/artist", youtube: "a".repeat(3_000) };
    document.get.mockResolvedValue(snapshotWith(older));

    await expect(getContactLinks()).resolves.toEqual({ data: older, etag: entityTag(older) });
  });

  it("returns empty links when the document holds only the photo, tagged by the links alone", async () => {
    document.get.mockResolvedValue(snapshotWith({ photo: { alt: "Portrait" } }));

    await expect(getContactLinks()).resolves.toEqual({
      data: emptyLinks,
      etag: entityTag(emptyLinks),
    });
  });
});

describe("replaceContactLinks", () => {
  it("merges the links so the photo in the same document is kept", async () => {
    await expect(replaceContactLinks(links, entityTag(emptyLinks))).resolves.toEqual({
      data: links,
      etag: entityTag(links),
    });
    expect(transaction.set).toHaveBeenCalledWith(document, links, { merge: true });
  });

  it("refuses links made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotWith(links));

    await expect(replaceContactLinks(links, entityTag(emptyLinks))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
