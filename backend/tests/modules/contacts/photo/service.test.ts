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

import { contactsDocument } from "#modules/contacts/document";
import {
  deleteContactPhoto,
  getContactPhoto,
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
const etag = '"read"';
const body = { alt: "Portrait", uploadId: "11111111-1111-4111-8111-111111111111" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contact photo service", () => {
  it("keeps the photo in the photo field of the contacts document", async () => {
    await getContactPhoto();
    await saveContactPhoto(body, etag);
    await updateContactPhotoAlt("New alt", etag);
    await deleteContactPhoto(etag);

    expect(photo.getPhoto).toHaveBeenCalledWith(contactPhoto);
    expect(photo.savePhoto).toHaveBeenCalledWith(contactPhoto, body, etag);
    expect(photo.updatePhotoAlt).toHaveBeenCalledWith(contactPhoto, "New alt", etag);
    expect(photo.deletePhoto).toHaveBeenCalledWith(contactPhoto, etag);
  });
});
