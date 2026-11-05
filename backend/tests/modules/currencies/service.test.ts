import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    doc: () => document,
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));

import { getCurrencyRates, replaceCurrencyRates } from "#modules/currencies/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const rates = { rates: { EUR: 0.92, PLN: 3.65 } };
const noRates = { rates: {} };

function snapshotOf(data: unknown) {
  return { data: () => data, exists: data !== undefined };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotOf(undefined));
  transaction.get.mockResolvedValue(snapshotOf(undefined));
});

describe("getCurrencyRates", () => {
  it("returns no rates before they are first saved", async () => {
    await expect(getCurrencyRates()).resolves.toEqual({ data: noRates, etag: entityTag(noRates) });
  });

  it("reads a saved rate outside today's rules, tagged by what is stored", async () => {
    const older = { rates: { SEK: 10.123456 } };
    document.get.mockResolvedValue(snapshotOf(older));

    await expect(getCurrencyRates()).resolves.toEqual({ data: older, etag: entityTag(older) });
  });
});

describe("replaceCurrencyRates", () => {
  it("stores the rates and returns them with their new tag", async () => {
    await expect(replaceCurrencyRates(rates, entityTag(noRates))).resolves.toEqual({
      data: rates,
      etag: entityTag(rates),
    });
    expect(transaction.set).toHaveBeenCalledWith(document, rates);
  });

  it("keeps the tag when the rates come back in another order", async () => {
    const { etag } = await replaceCurrencyRates(rates, entityTag(noRates));
    document.get.mockResolvedValue(snapshotOf({ rates: { PLN: 3.65, EUR: 0.92 } }));

    await expect(getCurrencyRates()).resolves.toMatchObject({ etag });
  });

  it("refuses rates changed since they were read", async () => {
    transaction.get.mockResolvedValue(snapshotOf(rates));

    await expect(replaceCurrencyRates(noRates, entityTag(noRates))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
