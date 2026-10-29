import { describe, expect, it } from "vitest";

import type { ContactsWithPhoto } from "@/entities/contacts";
import { getContactsChanges } from "@/features/edit-contacts/model/contactsChanges";
import type { ContactsFormValues } from "@/features/edit-contacts/model/contactsFormSchema";
import { savedImage } from "@/shared/lib/imageFieldValue";

import { apiPhoto, imageFile } from "../../../support/images";

const saved: ContactsWithPhoto = {
  contacts: {
    email: "artist@example.com",
    instagram: "https://instagram.com/artist",
    linkedin: "",
    youtube: "",
  },
  photo: apiPhoto("Портрет"),
};

const values: ContactsFormValues = { ...saved.contacts, photo: savedImage, photoAlt: "Портрет" };

describe("getContactsChanges", () => {
  it("is empty when nothing was changed", () => {
    expect(getContactsChanges(values, {}, saved)).toEqual({});
  });

  it("sends every link when one of them was changed: the server replaces them all", () => {
    expect(
      getContactsChanges(
        { ...values, youtube: "https://youtube.com/@artist" },
        { youtube: true },
        saved,
      ),
    ).toEqual({
      contacts: {
        email: "artist@example.com",
        instagram: "https://instagram.com/artist",
        linkedin: "",
        youtube: "https://youtube.com/@artist",
      },
    });
  });

  it("sends only the photo when only the photo was changed", () => {
    const file = imageFile();

    expect(getContactsChanges({ ...values, photo: file }, { photo: true }, saved)).toEqual({
      photo: { alt: "Портрет", file, type: "upload" },
    });
  });

  it("sends the links and the photo together", () => {
    expect(
      getContactsChanges(
        { ...values, linkedin: "https://linkedin.com/in/artist", photoAlt: "Автопортрет" },
        { linkedin: true, photoAlt: true },
        saved,
      ),
    ).toEqual({
      contacts: { ...saved.contacts, linkedin: "https://linkedin.com/in/artist" },
      photo: { alt: "Автопортрет", type: "updateAlt" },
    });
  });
});
