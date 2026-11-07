import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "./support/adminSession.js";
import { startTestServer, type TestServer } from "./support/testServer.js";

type Fields = Record<string, unknown>;

const store = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#shared/i18n/deepl", () => ({ translateTexts: vi.fn().mockRejectedValue(new Error()) }));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));
vi.mock("#shared/firebase/firestore", () => {
  function snapshot(path: string) {
    const data = store.get(path);

    return { data: () => data, exists: data !== undefined, get: (field: string) => data?.[field] };
  }

  const transaction = {
    get: (reference: { path: string }) => snapshot(reference.path),
    // Like Firestore, replaces the fields named in mergeFields and keeps the others.
    set(
      { path }: { path: string },
      fields: Record<string, unknown>,
      { mergeFields }: { mergeFields: string[] },
    ) {
      const saved = { ...store.get(path) };

      for (const field of mergeFields) {
        saved[field] = fields[field];
      }

      store.set(path, saved);
    },
  };

  return {
    firestore: () => ({
      doc: (path: string) => ({ get: async () => snapshot(path), path }),
      runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
    }),
  };
});

import { server as application } from "#server";
import { UnauthorizedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const materialId = "11111111-1111-4111-8111-111111111111";
const otherMaterialId = "22222222-2222-4222-8222-222222222222";

interface Resource {
  /** A body with what the rules change, such as spaces around a text. */
  body: Fields;
  /** What the body becomes. */
  data: Fields;
  empty: Fields;
  /** The field of the document that holds the data, if it is not the document itself. */
  field?: string;
  invalid: Fields;
  path: string;
  url: string;
}

const links = {
  email: "artist@example.com",
  instagram: "",
  linkedin: "",
  youtube: "https://youtu.be/video",
};

const resources: Resource[] = [
  {
    body: { text: "  Живопись.  ", translations: {} },
    data: { text: "Живопись.", translations: {} },
    empty: { text: "", translations: {} },
    invalid: { text: "а".repeat(1_001), translations: {} },
    path: "site/galleryIntro",
    url: "/api/gallery/intro",
  },
  {
    body: { text: "  Проекты.  ", translations: {} },
    data: { text: "Проекты.", translations: {} },
    empty: { text: "", translations: {} },
    invalid: { text: "", translations: {} },
    path: "site/projectsIntro",
    url: "/api/projects/intro",
  },
  {
    body: {
      colors: [
        { hex: "#FFFFFF", id: otherMaterialId, title: "Белый" },
        { hex: "#000000", id: materialId, title: " Антрацит " },
      ],
      translations: {},
    },
    data: {
      colors: [
        { hex: "#000000", id: materialId, title: "Антрацит" },
        { hex: "#ffffff", id: otherMaterialId, title: "Белый" },
      ],
      translations: {},
    },
    empty: { colors: [], translations: {} },
    invalid: { colors: [{ hex: "red", id: materialId, title: "Красный" }], translations: {} },
    path: "site/galleryColors",
    url: "/api/gallery/colors",
  },
  {
    body: {
      materials: [
        { id: otherMaterialId, title: "Масло" },
        { id: materialId, title: " Акварель " },
      ],
      translations: {},
    },
    data: {
      materials: [
        { id: materialId, title: "Акварель" },
        { id: otherMaterialId, title: "Масло" },
      ],
      translations: {},
    },
    empty: { materials: [], translations: {} },
    invalid: { materials: [{ id: materialId, title: "" }], translations: {} },
    path: "site/galleryMaterials",
    url: "/api/gallery/materials",
  },
  {
    body: {
      palettes: [
        { id: otherMaterialId, title: "Яркая" },
        { id: materialId, title: " Пастельная " },
      ],
      translations: {},
    },
    data: {
      palettes: [
        { id: materialId, title: "Пастельная" },
        { id: otherMaterialId, title: "Яркая" },
      ],
      translations: {},
    },
    empty: { palettes: [], translations: {} },
    invalid: { palettes: [{ id: "not-a-uuid", title: "Яркая" }], translations: {} },
    path: "site/galleryPalettes",
    url: "/api/gallery/palettes",
  },
  {
    body: { rates: { EUR: 0.92 } },
    data: { rates: { EUR: 0.92 } },
    empty: { rates: {} },
    invalid: { rates: { XXX: 1 } },
    path: "site/currencies",
    url: "/api/currencies",
  },
  {
    body: { about: " О себе ", biography: "Биография", creation: "Творчество", translations: {} },
    data: { about: "О себе", biography: "Биография", creation: "Творчество", translations: {} },
    empty: { about: "", biography: "", creation: "", translations: {} },
    field: "text",
    invalid: { about: "", biography: "Биография", creation: "Творчество", translations: {} },
    path: "site/about",
    url: "/api/about/text",
  },
  {
    body: { ...links, email: " artist@example.com " },
    data: links,
    empty: { email: "", instagram: "", linkedin: "", youtube: "" },
    field: "links",
    invalid: { ...links, youtube: "https://example.com/video" },
    path: "site/contacts",
    url: "/api/contacts/links",
  },
];

let server: TestServer;

function put(url: string, body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}${url}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(application);
});

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  auth.verifySession.mockResolvedValue({ email: "admin@example.com", uid: "admin-uid" });
});

afterAll(() => server.close());

describe.each(resources)("$url", ({ body, data, empty, field, invalid, path, url }) => {
  /** The data as saved in the document. */
  function saved(value: Fields): Fields {
    return field === undefined ? value : { [field]: value };
  }

  it("is empty for every visitor until it is first saved", async () => {
    const response = await fetch(`${server.baseUrl}${url}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(entityTag(empty));
    await expect(response.json()).resolves.toEqual(empty);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("returns what is saved, even if it breaks today's rules", async () => {
    store.set(path, saved(invalidButWellShaped(empty)));

    const response = await fetch(`${server.baseUrl}${url}`);

    await expect(response.json()).resolves.toEqual(invalidButWellShaped(empty));
  });

  it("saves the admin's change against the ETag it was read with", async () => {
    const response = await put(url, body, {
      ...(await adminHeaders(server.baseUrl)),
      "If-Match": entityTag(empty),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(entityTag(data));
    await expect(response.json()).resolves.toEqual(data);
    expect(store.get(path)).toEqual(saved(data));
  });

  it("keeps the other fields of the document", async () => {
    store.set(path, { photo: "saved" });

    const response = await put(url, body, {
      ...(await adminHeaders(server.baseUrl)),
      "If-Match": entityTag(empty),
    });

    expect(response.status).toBe(200);
    expect(store.get(path)).toEqual({ photo: "saved", ...saved(data) });
  });

  it("refuses a change made from an outdated read", async () => {
    const response = await put(url, body, {
      ...(await adminHeaders(server.baseUrl)),
      "If-Match": '"outdated"',
    });

    expect(response.status).toBe(412);
    expect(store.has(path)).toBe(false);
  });

  it("requires If-Match", async () => {
    const response = await put(url, body, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(428);
  });

  it("rejects a body that breaks the rules", async () => {
    const response = await put(url, invalid, {
      ...(await adminHeaders(server.baseUrl)),
      "If-Match": entityTag(empty),
    });

    expect(response.status).toBe(400);
    expect(store.has(path)).toBe(false);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await fetch(`${server.baseUrl}${url}`, {
      body: "text",
      headers: {
        ...(await adminHeaders(server.baseUrl)),
        "Content-Type": "text/plain",
        "If-Match": entityTag(empty),
      },
      method: "PUT",
    });

    expect(response.status).toBe(415);
  });

  it("rejects a change without a session", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await put(url, body, { "If-Match": entityTag(empty) });

    expect(response.status).toBe(401);
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await put(url, body, {
      Cookie: adminSessionCookie,
      "If-Match": entityTag(empty),
    });

    expect(response.status).toBe(403);
  });
});

/** Data of the same shape as `empty` that no body may have, such as a text over its limit. */
function invalidButWellShaped(empty: Fields): Fields {
  const entries = Object.entries(empty).map(([key, value]) => [
    key,
    typeof value === "string" ? "а".repeat(10_000) : value,
  ]);

  return Object.fromEntries(entries);
}

describe("the currency rates", () => {
  it("drops a currency left out of the new rates", async () => {
    const rates = { rates: { EUR: 0.92, PLN: 3.9 } };
    store.set("site/currencies", rates);

    const response = await put(
      "/api/currencies",
      { rates: { EUR: 0.92 } },
      { ...(await adminHeaders(server.baseUrl)), "If-Match": entityTag(rates) },
    );

    expect(response.status).toBe(200);
    expect(store.get("site/currencies")).toEqual({ rates: { EUR: 0.92 } });
  });
});
