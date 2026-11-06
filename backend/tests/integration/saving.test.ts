import { randomUUID } from "node:crypto";

import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { aboutPhoto } from "#modules/about/photo";
import { aboutText } from "#modules/about/text/resource";
import { currencyRates } from "#modules/currencies/resource";
import {
  createProject,
  deleteProject,
  getProject,
  replaceProject,
} from "#modules/projects/service";
import { firestore } from "#shared/firebase/firestore";
import { storageBucket } from "#shared/firebase/storage";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";
import { getPhoto, savePhoto } from "#shared/images/photo";
import { saveUpload } from "#shared/images/uploads";

let png: Buffer;

/** Every file under `prefix`, without the uploads. */
async function filesIn(prefix: string): Promise<string[]> {
  const [files] = await storageBucket().getFiles({ prefix });

  return files.map((file) => file.name);
}

function upload(): Promise<string> {
  return saveUpload({ data: png, name: "фото.png", size: png.length });
}

async function newProject() {
  const id = randomUUID();
  const body = {
    title: `Проект ${id}`,
    description: "Описание",
    translations: {},
    link: "",
    photos: [{ alt: "Фото", uploadId: await upload() }],
  };
  const saved = await createProject(id, body);

  return { body, id, photoId: saved.data.photos[0]?.id as string, saved };
}

beforeAll(async () => {
  png = await sharp({
    create: { background: "#336699", channels: 3, height: 40, width: 60 },
  })
    .png()
    .toBuffer();
});

describe("a project with its photos", () => {
  it("serves the saved photo through its download URL", async () => {
    const { saved } = await newProject();
    const url = saved.data.photos[0]?.sources.webp[0]?.url as string;

    expect((await fetch(url)).status).toBe(200);
  });

  it("returns the tag a later read gives", async () => {
    const { id, saved } = await newProject();

    expect((await getProject(id)).etag).toBe(saved.etag);
  });

  it("replaces a file, then removes the old version", async () => {
    const { body, id, photoId, saved } = await newProject();
    const oldVersion = saved.data.photos[0]?.version as string;

    const replaced = await replaceProject(
      id,
      { ...body, photos: [{ alt: "Фото", id: photoId, uploadId: await upload() }] },
      saved.etag,
    );
    const files = await filesIn(`projects/${id}/`);
    const newVersion = replaced.data.photos[0]?.version as string;

    expect(files.some((name) => name.includes(newVersion))).toBe(true);
    expect(files.some((name) => name.includes(oldVersion))).toBe(false);
  });

  it("removes the copy of a change made from an outdated read", async () => {
    const { body, id, photoId, saved } = await newProject();
    const filesBefore = await filesIn(`projects/${id}/`);

    await expect(
      replaceProject(
        id,
        { ...body, photos: [{ alt: "Фото", id: photoId, uploadId: await upload() }] },
        '"outdated"',
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(await filesIn(`projects/${id}/`)).toEqual(filesBefore);
    expect((await getProject(id)).etag).toBe(saved.etag);
  });

  it("lets one of two saves from the same read win, and leaves no stray files", async () => {
    const { body, id, photoId, saved } = await newProject();
    const change = async (title: string) =>
      replaceProject(
        id,
        { ...body, title, photos: [{ alt: "Фото", id: photoId, uploadId: await upload() }] },
        saved.etag,
      );

    const results = await Promise.allSettled([change(`Первый ${id}`), change(`Второй ${id}`)]);
    const won = results.filter((result) => result.status === "fulfilled");
    const lost = results.filter((result) => result.status === "rejected");
    const { data } = await getProject(id);
    const versions = new Set(
      (await filesIn(`projects/${id}/`)).map((name) => name.split("/").at(-2)),
    );

    expect(won).toHaveLength(1);
    expect(lost[0]?.reason).toBeInstanceOf(PreconditionFailedError);
    expect(versions).toEqual(new Set([data.photos[0]?.version]));
  });

  it("deletes the project with all its files", async () => {
    const { id, saved } = await newProject();

    await deleteProject(id, saved.etag);

    expect(await filesIn(`projects/${id}/`)).toEqual([]);
  });
});

describe("a resource in a document with other fields", () => {
  it("keeps the photo when the texts change, and the texts when the photo changes", async () => {
    await aboutPhoto.document().delete();

    const text = { about: "О себе", biography: "Биография", creation: "Творчество" };
    const empty = await aboutText.get();
    const photo = await getPhoto(aboutPhoto);
    const saved = await savePhoto(
      aboutPhoto,
      { alt: "Портрет", uploadId: await upload() },
      photo.etag,
    );

    await aboutText.replace(text, empty.etag);

    expect((await aboutText.get()).data).toEqual(text);
    expect((await getPhoto(aboutPhoto)).etag).toBe(saved.etag);
  });
});

describe("a resource saved as a map", () => {
  it("drops a key left out of the new data", async () => {
    await firestore().doc("site/currencies").delete();

    const both = { rates: { EUR: 0.9, PLN: 3.9 } };
    const one = { rates: { EUR: 0.9 } };

    await currencyRates.replace(both, entityTag({ rates: {} }));
    await currencyRates.replace(one, entityTag(both));

    expect((await currencyRates.get()).data).toEqual(one);
  });
});
