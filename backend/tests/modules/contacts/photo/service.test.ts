import { beforeEach, describe, expect, it, vi } from "vitest";

const photo = vi.hoisted(() => ({
  deletePhoto: vi.fn(),
  savePhoto: vi.fn(),
  updatePhotoAlt: vi.fn(),
}));

vi.mock("#shared/images/photo", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...photo,
}));

import { contactsDocument } from "#modules/contacts/document";
import {
  deleteContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#modules/contacts/photo/service";
import { storedPhotoSchema } from "#shared/images/photo";

const contactPhoto = {
  document: contactsDocument,
  field: "photo",
  folder: "contacts/photo",
  schema: storedPhotoSchema,
};
const body = { alt: "Portrait", uploadId: "11111111-1111-4111-8111-111111111111" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contact photo service", () => {
  it("keeps the photo in the photo field of the contacts document", async () => {
    await saveContactPhoto(body);
    await updateContactPhotoAlt("New alt");
    await deleteContactPhoto();

    expect(photo.savePhoto).toHaveBeenCalledWith(contactPhoto, body);
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(contactPhoto, "New alt");
    expect(photo.deletePhoto).toHaveBeenCalledWith(contactPhoto);
  });
});
