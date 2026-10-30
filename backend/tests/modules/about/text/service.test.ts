import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#modules/about/document", () => ({ aboutDocument: () => document }));

import { getAboutText, saveAboutText } from "#modules/about/text/service";

const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

function storedAs(fields: Record<string, unknown>) {
  document.get.mockResolvedValue({ get: (field: string) => fields[field] });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("about text service", () => {
  it("returns empty texts before they are first saved", async () => {
    storedAs({});

    await expect(getAboutText()).resolves.toEqual({ about: "", biography: "", creation: "" });
  });

  it("reads saved texts longer than today's limits", async () => {
    const longer = { ...text, about: "a".repeat(1_000) };
    storedAs({ text: longer });

    await expect(getAboutText()).resolves.toEqual(longer);
  });

  it("saves the texts without touching the photos", async () => {
    await saveAboutText(text);

    expect(document.set).toHaveBeenCalledWith({ text }, { merge: true });
  });
});
