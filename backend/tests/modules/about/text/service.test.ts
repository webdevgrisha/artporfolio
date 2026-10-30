import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#modules/about/document", () => ({ aboutDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));

import { getAboutText, replaceAboutText } from "#modules/about/text/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };
const emptyText = { about: "", biography: "", creation: "" };

function snapshotWith(fields: Record<string, unknown>) {
  return { get: (field: string) => fields[field] };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotWith({}));
  transaction.get.mockResolvedValue(snapshotWith({}));
});

describe("getAboutText", () => {
  it("returns empty texts before they are first saved", async () => {
    await expect(getAboutText()).resolves.toEqual({
      data: emptyText,
      etag: entityTag(emptyText),
    });
  });

  it("reads saved texts longer than today's limits, tagged by what is stored", async () => {
    const longer = { ...text, about: "a".repeat(1_000) };
    document.get.mockResolvedValue(snapshotWith({ text: longer }));

    await expect(getAboutText()).resolves.toEqual({ data: longer, etag: entityTag(longer) });
  });
});

describe("replaceAboutText", () => {
  it("saves the texts without touching the photos and returns their new tag", async () => {
    await expect(replaceAboutText(text, entityTag(emptyText))).resolves.toEqual({
      data: text,
      etag: entityTag(text),
    });
    expect(transaction.set).toHaveBeenCalledWith(document, { text }, { merge: true });
  });

  it("refuses texts made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotWith({ text }));

    await expect(replaceAboutText(text, entityTag(emptyText))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
