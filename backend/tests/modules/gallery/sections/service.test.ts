import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `gallerySections` collection: documents by id. Transactions write to it at once. */
const sections = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("#shared/firebase/firestore", () => {
  function snapshot(id: string) {
    const data = sections.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  function document(id: string) {
    return { get: async () => snapshot(id), id };
  }

  const collection = {
    doc: document,
    get: async () => ({ docs: [...sections.keys()].map(snapshot) }),
  };

  const transaction = {
    create: (ref: { id: string }, data: Record<string, unknown>) => sections.set(ref.id, data),
    delete: (ref: { id: string }) => sections.delete(ref.id),
    get: (target: { get: () => unknown }) => target.get(),
    set: (ref: { id: string }, data: Record<string, unknown>) => sections.set(ref.id, data),
  };

  return {
    firestore: () => ({
      collection: () => collection,
      runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
    }),
  };
});

import {
  createSection,
  deleteSection,
  getSection,
  listSections,
  replaceSection,
} from "#modules/gallery/sections/service";
import { ConflictError, NotFoundError, PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const postersId = "11111111-1111-4111-8111-111111111111";
const graphicsId = "22222222-2222-4222-8222-222222222222";
const theatreId = "33333333-3333-4333-8333-333333333333";
const adsId = "44444444-4444-4444-8444-444444444444";
const newId = "55555555-5555-4555-8555-555555555555";
const landscapeId = "66666666-6666-4666-8666-666666666666";
const abstractId = "77777777-7777-4777-8777-777777777777";

const posters = {
  title: "Постеры",
  subsections: [
    { id: adsId, title: "Рекламные" },
    { id: theatreId, title: "Театральные" },
  ],
};
const graphics = { title: "Графика", subsections: [] };

beforeEach(() => {
  sections.clear();
  sections.set(postersId, posters);
  sections.set(graphicsId, graphics);
});

describe("reading the sections", () => {
  it("lists every section by title, tagged by the list", async () => {
    const list = [
      { id: graphicsId, ...graphics },
      { id: postersId, ...posters },
    ];

    await expect(listSections()).resolves.toEqual({ data: list, etag: entityTag(list) });
  });

  it("sorts by the Russian alphabet, not by code points", async () => {
    sections.clear();
    sections.set(postersId, { title: "Ёлочные", subsections: [] });
    sections.set(graphicsId, { title: "Живопись", subsections: [] });
    sections.set(newId, { title: "Евро", subsections: [] });

    const { data } = await listSections();

    expect(data.map(({ title }) => title)).toEqual(["Евро", "Ёлочные", "Живопись"]);
  });

  it("returns one section tagged by what is stored", async () => {
    await expect(getSection(postersId)).resolves.toEqual({
      data: { id: postersId, ...posters },
      etag: entityTag(posters),
    });
  });

  it("returns 404 for a section that does not exist", async () => {
    await expect(getSection(newId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("creating a section", () => {
  it("saves the subsections sorted by title", async () => {
    const painting = {
      title: "Живопись",
      subsections: [
        { id: landscapeId, title: "Пейзаж" },
        { id: abstractId, title: "Абстракция" },
      ],
    };
    const stored = { ...painting, subsections: painting.subsections.toReversed() };

    await expect(createSection(newId, painting)).resolves.toEqual({
      data: { id: newId, ...stored },
      etag: entityTag(stored),
    });
    expect(sections.get(newId)).toEqual(stored);
  });

  it("returns 412 for a section that exists, such as one an earlier try created", async () => {
    await expect(createSection(postersId, posters)).rejects.toBeInstanceOf(PreconditionFailedError);
  });

  it("refuses the title of another section, whatever the case", async () => {
    await expect(createSection(newId, { title: "ГРАФИКА", subsections: [] })).rejects.toEqual(
      new ConflictError("Another section has this title"),
    );
    expect(sections.has(newId)).toBe(false);
  });

  it("refuses a subsection id that another section or its subsection has", async () => {
    for (const id of [theatreId, graphicsId, newId]) {
      await expect(
        createSection(newId, { title: "Живопись", subsections: [{ id, title: "Пейзаж" }] }),
      ).rejects.toBeInstanceOf(ConflictError);
    }
    expect(sections.has(newId)).toBe(false);
  });

  it("refuses an id that a subsection of another section has", async () => {
    await expect(createSection(theatreId, { title: "Живопись", subsections: [] })).rejects.toEqual(
      new ConflictError("The section has the id of a subsection of another section"),
    );
    expect(sections.has(theatreId)).toBe(false);
  });
});

describe("replacing a section", () => {
  it("renames the section and drops a subsection left out", async () => {
    const next = { title: "Плакаты", subsections: [{ id: theatreId, title: "Театральные" }] };

    await expect(replaceSection(postersId, next, entityTag(posters))).resolves.toEqual({
      data: { id: postersId, ...next },
      etag: entityTag(next),
    });
    expect(sections.get(postersId)).toEqual(next);
  });

  it("keeps its own title and subsections", async () => {
    await expect(replaceSection(postersId, posters, entityTag(posters))).resolves.toMatchObject({
      data: { id: postersId, ...posters },
    });
  });

  it("refuses a change made from an outdated read", async () => {
    await expect(replaceSection(postersId, graphics, entityTag(graphics))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(sections.get(postersId)).toEqual(posters);
  });

  it("refuses the title of another section", async () => {
    await expect(
      replaceSection(postersId, { ...posters, title: "графика" }, entityTag(posters)),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("returns 404 for a section that does not exist", async () => {
    await expect(replaceSection(newId, posters, entityTag(posters))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("deleting a section", () => {
  it("deletes the section with its subsections", async () => {
    await deleteSection(postersId, entityTag(posters));

    expect(sections.has(postersId)).toBe(false);
  });

  it("refuses a section changed since it was read", async () => {
    await expect(deleteSection(postersId, entityTag(graphics))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(sections.has(postersId)).toBe(true);
  });
});
