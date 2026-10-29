import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { About, AboutText } from "@/entities/about";
import { getPhotoChange, type PhotoChange } from "@/shared/lib/photoForm";

import type { AboutFormValues } from "./aboutFormSchema";
import { aboutTextFields } from "./aboutTextFields";
import { getProcessPhotosChanges, type ProcessPhotosChanges } from "./processPhotosChanges";

/** What a save sends to the server: only the parts that were changed. */
export interface AboutChanges {
  photo?: PhotoChange;
  processPhotos?: ProcessPhotosChanges;
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

  const photo = getPhotoChange(values, {
    hasServerPhoto: saved.photo !== null,
    isAltDirty: Boolean(dirtyFields.photoAlt),
  });
  if (photo) changes.photo = photo;

  const processPhotos = getProcessPhotosChanges(values.processPhotos, saved.processPhotos);
  if (processPhotos) changes.processPhotos = processPhotos;

  return changes;
}
