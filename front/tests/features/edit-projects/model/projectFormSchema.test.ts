import { describe, expect, it } from "vitest";

import {
  emptyProjectFormValues,
  projectFormSchema,
} from "@/features/edit-projects/model/projectFormSchema";

import { fieldErrors } from "../../../support/schema";

const project = {
  ...emptyProjectFormValues,
  photos: [{ alt: "Обложка", file: new File([""], "cover.png"), status: "new" as const }],
  title: "Слон",
};

describe("projectFormSchema", () => {
  it("needs a title and a photo", () => {
    expect(fieldErrors(projectFormSchema, project)).toEqual({});
    expect(fieldErrors(projectFormSchema, emptyProjectFormValues)).toEqual({
      photos: ["Добавьте хотя бы одно фото"],
      title: ["Введите название"],
    });
  });

  it("takes only web links", () => {
    expect(fieldErrors(projectFormSchema, { ...project, link: "https://elephant.com" })).toEqual(
      {},
    );
    expect(fieldErrors(projectFormSchema, { ...project, link: "javascript:alert(1)" })).toEqual({
      link: ["Введите ссылку вида https://…"],
    });
  });

  it("limits the texts", () => {
    expect(
      fieldErrors(projectFormSchema, {
        ...project,
        description: "a".repeat(2_001),
        title: "a".repeat(101),
      }),
    ).toEqual({
      description: ["Не длиннее 2000 символов"],
      title: ["Не длиннее 100 символов"],
    });
  });
});
