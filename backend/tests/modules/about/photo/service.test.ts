import { beforeEach, describe, expect, it, vi } from "vitest";

const photo = vi.hoisted(() => ({
  deletePhoto: vi.fn(),
  getPhoto: vi.fn(),
  savePhoto: vi.fn(),
  updatePhotoAlt: vi.fn(),
}));

vi.mock("#shared/images/photo", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...photo,
}));

import { aboutDocument } from "#modules/about/document";
import {
  deleteAboutPhoto,
  getAboutPhoto,
  saveAboutPhoto,
  updateAboutPhotoAlt,
} from "#modules/about/photo/service";
import { storedPhotoSchema } from "#shared/images/photo";

const aboutPhoto = {
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
  schema: storedPhotoSchema,
};
const etag = '"read"';
const body = { alt: "Portrait", uploadId: "11111111-1111-4111-8111-111111111111" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("about photo service", () => {
  it("keeps «My photo» in the photo field of the About document", async () => {
    await getAboutPhoto();
    await saveAboutPhoto(body, etag);
    await updateAboutPhotoAlt("New alt", etag);
    await deleteAboutPhoto(etag);

    expect(photo.getPhoto).toHaveBeenCalledWith(aboutPhoto);
    expect(photo.savePhoto).toHaveBeenCalledWith(aboutPhoto, body, etag);
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(aboutPhoto, "New alt", etag);
    expect(photo.deletePhoto).toHaveBeenCalledWith(aboutPhoto, etag);
  });
});
