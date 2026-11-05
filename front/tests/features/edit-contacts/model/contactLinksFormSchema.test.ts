import { describe, expect, it } from "vitest";

import {
  type ContactLinksFormValues,
  contactLinksFormSchema,
} from "@/features/edit-contacts/model/contactLinksFormSchema";

import { fieldErrors } from "../../../support/schema";

const values: ContactLinksFormValues = {
  email: "artist@example.com",
  instagram: "",
  linkedin: "",
  youtube: "",
};

function errors(changed: Partial<ContactLinksFormValues>): Record<string, string[]> {
  return fieldErrors(contactLinksFormSchema, { ...values, ...changed });
}

describe("contactLinksFormSchema", () => {
  it("takes empty links: they are hidden on the site", () => {
    expect(errors({})).toEqual({});
  });

  it("needs an email", () => {
    expect(errors({ email: "  " })).toEqual({ email: ["Введите email"] });
  });

  it("trims the links", () => {
    expect(
      contactLinksFormSchema.parse({ ...values, instagram: "  https://instagram.com/artist  " })
        .instagram,
    ).toBe("https://instagram.com/artist");
  });

  it("takes only http and https links", () => {
    expect(errors({ youtube: "https://youtube.com/@artist" })).toEqual({});
    expect(errors({ linkedin: "http://linkedin.com/in/artist" })).toEqual({});
    expect(errors({ instagram: "instagram.com/artist" })).toEqual({
      instagram: ["Введите ссылку вида https://…"],
    });
    expect(errors({ instagram: "ftp://instagram.com/artist" })).toEqual({
      instagram: ["Введите ссылку вида https://…"],
    });
  });

  it("takes only a link to the network of the field", () => {
    expect(errors({ instagram: "https://www.instagram.com/artist" })).toEqual({});
    expect(errors({ youtube: "https://youtu.be/abc" })).toEqual({});
    expect(errors({ instagram: "https://youtube.com/@artist" })).toEqual({
      instagram: ["Введите ссылку на Instagram"],
    });
    expect(errors({ linkedin: "https://notlinkedin.com/in/artist" })).toEqual({
      linkedin: ["Введите ссылку на LinkedIn"],
    });
  });

  it("takes only a valid email", () => {
    expect(errors({ email: "artist@example.com" })).toEqual({});
    expect(errors({ email: "artist@" })).toEqual({ email: ["Введите корректный email"] });
  });
});
