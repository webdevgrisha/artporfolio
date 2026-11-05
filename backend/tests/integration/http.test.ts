import { randomUUID } from "node:crypto";

import express from "express";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { server as application } from "#server";
import { moveBodyToRawBody, readMultipartLikeCloudFunctions } from "../support/routeApp.js";
import { startTestServer, type TestServer } from "../support/testServer.js";

const project = "demo-artportfolio";
const authUrl = `http://${String(process.env.FIREBASE_AUTH_EMULATOR_HOST)}/identitytoolkit.googleapis.com/v1`;
const email = "admin@example.com";
const password = "admin-password";

let server: TestServer;

/** Makes the admin in the Auth emulator and signs in, as the login form does with Firebase. */
async function signIn(): Promise<string> {
  await fetch(`${authUrl}/projects/${project}/accounts`, {
    body: JSON.stringify({ email, localId: "admin-uid", password }),
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    method: "POST",
  });

  const response = await fetch(`${authUrl}/accounts:signInWithPassword?key=emulator`, {
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const { idToken } = (await response.json()) as { idToken: string };

  return idToken;
}

beforeAll(async () => {
  // Cloud Functions reads the body before the app does.
  const app = express();

  app.use(readMultipartLikeCloudFunctions, moveBodyToRawBody, application);
  server = await startTestServer(app);
});

afterAll(() => server.close());

describe("the admin's way through the API", () => {
  it("signs in, uploads a photo, creates, changes and deletes a project, and signs out", async () => {
    const url = (path: string) => `${server.baseUrl}/api${path}`;

    const login = await fetch(url("/auth/login"), {
      body: JSON.stringify({ idToken: await signIn() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(login.status).toBe(200);

    const [Cookie] = (login.headers.get("Set-Cookie") ?? "").split(";") as [string];

    expect((await fetch(url("/auth/me"), { headers: { Cookie } })).status).toBe(200);

    const csrf = await fetch(url("/auth/csrf"), { headers: { Cookie } });
    const { csrfToken } = (await csrf.json()) as { csrfToken: string };
    const session = { Cookie, "X-CSRF-Token": csrfToken };

    const png = await sharp({
      create: { background: "#336699", channels: 3, height: 40, width: 60 },
    })
      .png()
      .toBuffer();
    const form = new FormData();

    form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "фото.png");

    const upload = await fetch(url("/uploads"), { body: form, headers: session, method: "POST" });

    expect(upload.status).toBe(201);

    const { id: uploadId } = (await upload.json()) as { id: string };
    const id = randomUUID();
    const body = {
      description: "Описание",
      link: "",
      photos: [{ alt: "Фото", uploadId }],
      title: `Проект ${id}`,
    };
    const json = { ...session, "Content-Type": "application/json" };

    const anonymous = await fetch(url(`/projects/${id}`), {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "If-None-Match": "*" },
      method: "PUT",
    });

    expect(anonymous.status).toBe(401);

    const created = await fetch(url(`/projects/${id}`), {
      body: JSON.stringify(body),
      headers: { ...json, "If-None-Match": "*" },
      method: "PUT",
    });

    expect(created.status).toBe(201);

    const read = await fetch(url(`/projects/${id}`));
    const etag = read.headers.get("ETag") as string;
    const { photos } = (await read.json()) as { photos: { id: string; original: string }[] };
    const photo = photos[0] as { id: string; original: string };

    expect(etag).toBe(created.headers.get("ETag"));
    expect((await fetch(`${server.baseUrl}${photo.original}`)).status).toBe(401);
    expect(
      (await fetch(`${server.baseUrl}${photo.original}`, { headers: { Cookie } })).status,
    ).toBe(200);

    const changed = await fetch(url(`/projects/${id}`), {
      body: JSON.stringify({
        ...body,
        photos: [{ alt: "Новое фото", id: photo.id }],
        title: `Другой проект ${id}`,
      }),
      headers: { ...json, "If-Match": etag },
      method: "PUT",
    });

    expect(changed.status).toBe(200);

    const outdated = await fetch(url(`/projects/${id}`), {
      headers: { ...session, "If-Match": etag },
      method: "DELETE",
    });

    expect(outdated.status).toBe(412);

    const deleted = await fetch(url(`/projects/${id}`), {
      headers: { ...session, "If-Match": changed.headers.get("ETag") as string },
      method: "DELETE",
    });

    expect(deleted.status).toBe(204);
    expect((await fetch(url(`/projects/${id}`))).status).toBe(404);

    const logout = await fetch(url("/auth/logout"), { headers: session, method: "POST" });

    expect(logout.status).toBe(204);
    expect(logout.headers.get("Set-Cookie")).toMatch(/^__session=;/);
  });
});
