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
const body = { alt: "Portrait", uploadId: "11111111-1111-4111-8111-111111111111" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("about photo service", () => {
  it("keeps «My photo» in the photo field of the About document", async () => {
    await saveAboutPhoto(body);
    await updateAboutPhotoAlt("New alt");
    await deleteAboutPhoto();

    expect(photo.savePhoto).toHaveBeenCalledWith(aboutPhoto, body);
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(aboutPhoto, "New alt");
    expect(photo.deletePhoto).toHaveBeenCalledWith(aboutPhoto);
  });
});
