import { describe, expect, it } from "vitest";

import { projectsIntroFormSchema } from "@/features/edit-projects/model/projectsIntroFormSchema";

import { fieldErrors } from "../../../support/schema";

describe("projectsIntroFormSchema", () => {
  it("needs a text", () => {
    expect(fieldErrors(projectsIntroFormSchema, { text: "О проектах." })).toEqual({});
    expect(fieldErrors(projectsIntroFormSchema, { text: " \n " })).toEqual({
      text: ["Введите текст"],
    });
  });
});
