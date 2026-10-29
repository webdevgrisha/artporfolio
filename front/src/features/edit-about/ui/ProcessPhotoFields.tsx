import clsx from "clsx";
import React from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxProcessPhotos, type ProcessPhoto } from "@/entities/about";
import { imageUploadRules } from "@/shared/api/image";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { imageToMediaItem } from "@/shared/ui/media-preview";
import { type SortableMediaItem, SortableMediaList } from "@/shared/ui/sortable-media-list";

import type { AboutFormValues, ProcessPhotoRow } from "../model/aboutFormSchema";
import styles from "./ProcessPhotoFields.module.css";

interface ProcessPhotoFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The process photos on the server, shown for the rows that keep their saved file. */
  serverPhotos: readonly ProcessPhoto[];
}

function toMediaItem(
  key: string,
  row: ProcessPhotoRow,
  savedPhoto: ProcessPhoto | undefined,
): SortableMediaItem {
  if (row.file) {
    // A new photo, or one whose saved file is replaced.
    return {
      id: key,
      isModified: true,
      name: row.file.name,
      size: row.file.size,
      source: row.file,
    };
  }

  // A saved row always has its photo on the server; an empty item covers the moment between a
  // save and the reload of the server photos.
  return savedPhoto
    ? { ...imageToMediaItem(savedPhoto), id: key }
    : { id: key, name: "", size: 0, source: "" };
}

/** The process photos tab of `EditAboutForm`; it reads the form from its context. */
export function ProcessPhotoFields({ className, isSaving, serverPhotos }: ProcessPhotoFieldsProps) {
  const { clearErrors, control, register, setError, setFocus, setValue } =
    useFormContext<AboutFormValues>();
  const { errors, isSubmitted } = useFormState({ control });
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, move, remove } = useFieldArray({ control, name: "processPhotos" });
  const rows = useWatch({ control, name: "processPhotos" });
  const serverPhotosById = React.useMemo(
    () => new Map(serverPhotos.map((photo) => [photo.id, photo])),
    [serverPhotos],
  );

  const items = fields.map((field, index): SortableMediaItem => {
    const row = rows[index] ?? field;
    const savedPhoto = row.status === "saved" ? serverPhotosById.get(row.photoId) : undefined;

    return toMediaItem(field.id, row, savedPhoto);
  });

  // Added rows are highlighted by themselves; the list shows that saved photos were removed or
  // moved.
  const savedOrder = serverPhotos.map((photo) => photo.id).join("\n");
  const rowsOrder = rows.flatMap((row) => (row.status === "saved" ? [row.photoId] : [])).join("\n");

  function getRowIndex(key: string): number {
    return fields.findIndex((field) => field.id === key);
  }

  function handleRejectionChange(message: string | undefined) {
    // A root error, unlike an error of the list, is not replaced when an added row revalidates
    // the list; the form drops it on a save or a revert.
    if (message) {
      setError("root.processPhotosRejection", { message });
    } else {
      clearErrors("root.processPhotosRejection");
    }
  }

  function clearAlt(index: number) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(`processPhotos.${index}.alt`, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(`processPhotos.${index}.alt`);
  }

  return (
    <div className={clsx(styles.root, className)}>
      <SortableMediaList
        label="Фото процесса"
        rules={imageUploadRules}
        maxItems={maxProcessPhotos}
        items={items}
        disabled={isSaving}
        error={
          errors.root?.processPhotosRejection?.message ??
          errors.processPhotos?.message ??
          errors.processPhotos?.root?.message
        }
        isModified={rowsOrder !== savedOrder}
        // The focus goes to the description of the first added photo.
        onAdd={(files) => append(files.map((file) => ({ alt: "", file, status: "new" })))}
        onMove={move}
        onRejectionChange={handleRejectionChange}
        onRemove={(key) => remove(getRowIndex(key))}
        onReplace={(key, file) =>
          setValue(`processPhotos.${getRowIndex(key)}.file`, file, { shouldDirty: true })
        }
        renderItemFields={(item, index) => {
          const row = rows[index];
          const savedAlt =
            row?.status === "saved" ? serverPhotosById.get(row.photoId)?.alt : undefined;

          return (
            <ClearableInput
              label="Описание"
              aria-label={`Описание ${item.name}`}
              placeholder="Например: эскиз углём на холсте"
              disabled={isSaving}
              error={errors.processPhotos?.[index]?.alt?.message}
              isModified={savedAlt !== undefined && row?.alt !== savedAlt}
              hasValue={Boolean(row?.alt)}
              clearLabel={`Очистить описание ${item.name}`}
              onClear={() => clearAlt(index)}
              {...register(`processPhotos.${index}.alt`)}
            />
          );
        }}
      />
    </div>
  );
}
