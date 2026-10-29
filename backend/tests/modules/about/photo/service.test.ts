import { beforeEach, describe, expect, it, vi } from "vitest";

const photo = vi.hoisted(() => ({
  deletePhoto: vi.fn(),
  savePhoto: vi.fn(),
  updatePhotoAlt: vi.fn(),
}));

vi.mock("#shared/images/photo", () => photo);

import { aboutDocument } from "#modules/about/document";
import {
  deleteAboutPhoto,
  saveAboutPhoto,
  updateAboutPhotoAlt,
} from "#modules/about/photo/service";

const aboutPhoto = { document: aboutDocument, field: "photo", folder: "about/photo" };
const upload = { data: Buffer.from("original"), name: "photo.png", size: 8 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("about photo service", () => {
  it("keeps «My photo» in the photo field of the About document", async () => {
    await saveAboutPhoto(upload, "Portrait");
    await updateAboutPhotoAlt("New alt");
    await deleteAboutPhoto();

    expect(photo.savePhoto).toHaveBeenCalledWith(aboutPhoto, upload, "Portrait");
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(aboutPhoto, "New alt");
    expect(photo.deletePhoto).toHaveBeenCalledWith(aboutPhoto);
  });
});
