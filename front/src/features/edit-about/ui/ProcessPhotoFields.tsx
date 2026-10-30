import clsx from "clsx";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxProcessPhotos, type ProcessPhoto } from "@/entities/about";
import { imageUploadRules } from "@/shared/api/image";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { imageToMediaItem } from "@/shared/ui/media-preview";
import { type SortableMediaItem, SortableMediaList } from "@/shared/ui/sortable-media-list";

import type { ProcessPhotoRow, ProcessPhotosFormValues } from "../model/processPhotosFormSchema";
import styles from "./ProcessPhotoFields.module.css";

interface ProcessPhotoFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The process photos on the server, to show that saved ones were removed or moved. */
  serverPhotos: readonly ProcessPhoto[];
}

/** A picked file: a new photo, or one that replaces a saved file. */
function toFileItem(key: string, file: File): SortableMediaItem {
  return { id: key, isModified: true, name: file.name, size: file.size, source: file };
}

function toMediaItem(key: string, row: ProcessPhotoRow): SortableMediaItem {
  if (row.status === "new") return toFileItem(key, row.file);

  return row.file ? toFileItem(key, row.file) : { ...imageToMediaItem(row.photo), id: key };
}

/** The fields of `EditProcessPhotosForm`; they read the form from its context. */
export function ProcessPhotoFields({ className, isSaving, serverPhotos }: ProcessPhotoFieldsProps) {
  const { clearErrors, control, register, setError, setFocus, setValue } =
    useFormContext<ProcessPhotosFormValues>();
  const { errors, isSubmitted } = useFormState({ control });
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, move, remove } = useFieldArray({ control, name: "processPhotos" });
  const rows = useWatch({ control, name: "processPhotos" });
  const items = fields.map((field, index) => toMediaItem(field.id, rows[index] ?? field));

  // Added rows are highlighted by themselves; the list shows that saved photos were removed or
  // moved.
  const savedOrder = serverPhotos.map((photo) => photo.id).join("\n");
  const rowsOrder = rows
    .flatMap((row) => (row.status === "saved" ? [row.photo.id] : []))
    .join("\n");

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

          return (
            <ClearableInput
              label="Описание"
              aria-label={`Описание ${item.name}`}
              placeholder="Например: эскиз углём на холсте"
              disabled={isSaving}
              error={errors.processPhotos?.[index]?.alt?.message}
              isModified={row?.status === "saved" && row.alt !== row.photo.alt}
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
