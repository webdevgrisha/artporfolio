import { describe, expect, it } from "vitest";

import {
  type AboutTextFormValues,
  aboutTextFormSchema,
} from "@/features/edit-about/model/aboutTextFormSchema";

import { toTranslationValues } from "@/shared/lib/translationsForm";

import { fieldErrors } from "../../../support/schema";

const values: AboutTextFormValues = {
  about: "Иллюстратор.",
  biography: "Родилась в Минске.",
  creation: "Пишет маслом.",
  translations: toTranslationValues({}, ["about", "biography", "creation"]),
};

describe("aboutTextFormSchema", () => {
  it("needs every text", () => {
    expect(fieldErrors(aboutTextFormSchema, values)).toEqual({});
    expect(
      fieldErrors(aboutTextFormSchema, { ...values, about: " ", biography: "", creation: "\n" }),
    ).toEqual({
      about: ["Введите текст"],
      biography: ["Введите текст"],
      creation: ["Введите текст"],
    });
  });

  it("trims the texts", () => {
    expect(aboutTextFormSchema.parse({ ...values, biography: "\n Родилась… \n" }).biography).toBe(
      "Родилась…",
    );
  });
});
