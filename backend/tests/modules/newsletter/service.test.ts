import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

const firestore = vi.hoisted(() => ({
  collection: vi.fn(),
  create: vi.fn(),
  doc: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    collection: (name: string) => {
      firestore.collection(name);
      return {
        doc: (id: string) => {
          firestore.doc(id);
          return { create: firestore.create };
        },
      };
    },
  }),
}));

import { addSubscriber } from "#modules/newsletter/service";

const idOf = (email: string) => createHash("sha256").update(email).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  firestore.create.mockResolvedValue(undefined);
});

describe("addSubscriber", () => {
  it("keeps the address as typed under the hash of it in small letters", async () => {
    await addSubscriber({ email: "Anna@Example.com", language: "pl" });

    expect(firestore.collection).toHaveBeenCalledWith("subscribers");
    expect(firestore.doc).toHaveBeenCalledWith(idOf("anna@example.com"));
    expect(firestore.create).toHaveBeenCalledWith({
      email: "Anna@Example.com",
      language: "pl",
      subscribedAt: expect.any(Timestamp),
    });
  });

  it("keeps the first subscription of an address already subscribed", async () => {
    firestore.create.mockRejectedValue(Object.assign(new Error("exists"), { code: 6 }));

    await expect(addSubscriber({ email: "anna@example.com", language: "en" })).resolves.toBe(
      undefined,
    );
  });

  it("passes on any other failure of Firestore", async () => {
    firestore.create.mockRejectedValue(Object.assign(new Error("unavailable"), { code: 14 }));

    await expect(addSubscriber({ email: "anna@example.com", language: "en" })).rejects.toThrow(
      "unavailable",
    );
  });
});
