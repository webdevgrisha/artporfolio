import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { aboutTextRoute } from "@/pages/about";
import {
  editCollectionRoute,
  editSectionRoute,
  editWorkRoute,
  galleryColorsRoute,
  galleryIntroRoute,
  galleryMaterialsRoute,
  galleryPalettesRoute,
} from "@/pages/gallery";
import { editProjectRoute, projectsIntroRoute } from "@/pages/projects";

const args = {
  currentUrl: new URL("http://localhost/admin/gallery/works/1"),
  defaultShouldRevalidate: true,
  nextUrl: new URL("http://localhost/admin/gallery/works/1?lang=en"),
} as ShouldRevalidateFunctionArgs;

describe("the routes of a form with languages", () => {
  it.each(
    Object.entries({
      aboutTextRoute,
      editCollectionRoute,
      editProjectRoute,
      editSectionRoute,
      editWorkRoute,
      galleryColorsRoute,
      galleryIntroRoute,
      galleryMaterialsRoute,
      galleryPalettesRoute,
      projectsIntroRoute,
    }),
  )("%s loads nothing again when the language changes", (_name, route) => {
    expect(route.shouldRevalidate(args)).toBe(false);
  });
});
