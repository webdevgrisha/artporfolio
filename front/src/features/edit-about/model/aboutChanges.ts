import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { About, AboutText } from "@/entities/about";

import type { AboutFormValues } from "./aboutFormSchema";
import { aboutTextFields } from "./aboutTextFields";

export type PhotoChange =
  | { alt: string; file: File; type: "upload" }
  | { alt: string; type: "updateAlt" }
  | { type: "delete" };

/** What a save sends to the server: only the parts that were changed. */
export interface AboutChanges {
  photo?: PhotoChange;
  text?: AboutText;
}

/** Picks the parts of the submitted values that differ from the saved ones. */
export function getAboutChanges(
  values: AboutFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<AboutFormValues>>>,
  saved: About,
): AboutChanges {
  const changes: AboutChanges = {};

  // The server replaces all texts at once.
  if (aboutTextFields.some((field) => dirtyFields[field.name])) {
    const { about, biography, creation } = values;
    changes.text = { about, biography, creation };
  }

  // The photo is compared by value: react-hook-form does not track changes inside a File.
  if (values.photo instanceof File) {
    changes.photo = { alt: values.photoAlt, file: values.photo, type: "upload" };
  } else if (values.photo === null) {
    if (saved.photo) changes.photo = { type: "delete" };
  } else if (dirtyFields.photoAlt) {
    changes.photo = { alt: values.photoAlt, type: "updateAlt" };
  }

  return changes;
}
