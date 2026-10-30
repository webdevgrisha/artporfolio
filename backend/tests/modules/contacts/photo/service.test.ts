import { beforeEach, describe, expect, it, vi } from "vitest";

const photo = vi.hoisted(() => ({
  deletePhoto: vi.fn(),
  savePhoto: vi.fn(),
  updatePhotoAlt: vi.fn(),
}));

vi.mock("#shared/images/photo", () => photo);

import { contactsDocument } from "#modules/contacts/document";
import {
  deleteContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#modules/contacts/photo/service";

const contactPhoto = { document: contactsDocument, field: "photo", folder: "contacts/photo" };
const upload = { data: Buffer.from("original"), name: "photo.png", size: 8 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contact photo service", () => {
  it("keeps the photo in the photo field of the contacts document", async () => {
    await saveContactPhoto(upload, "Portrait");
    await updateContactPhotoAlt("New alt");
    await deleteContactPhoto();

    expect(photo.savePhoto).toHaveBeenCalledWith(contactPhoto, upload, "Portrait");
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(contactPhoto, "New alt");
    expect(photo.deletePhoto).toHaveBeenCalledWith(contactPhoto);
  });
});
