import clsx from "clsx";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { imageUploadRules } from "@/shared/api/image";
import type { ListPhoto } from "@/shared/api/photo";
import type { PhotoListFormValues, PhotoListRow } from "@/shared/lib/photoListForm";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { imageToMediaItem } from "@/shared/ui/media-preview";
import { type SortableMediaItem, SortableMediaList } from "@/shared/ui/sortable-media-list";

import styles from "./PhotoListField.module.css";

interface PhotoListFieldProps {
  /** An example description, for the placeholder of every description field. */
  altPlaceholder: string;
  className?: string;
  isSaving: boolean;
  label: string;
  maxPhotos: number;
  /** The photos the rows were made from, to show that saved ones were removed or moved. */
  savedPhotos: readonly ListPhoto[];
}

/** A picked file: a new photo, or one that replaces a saved file. */
function toFileItem(key: string, file: File): SortableMediaItem {
  return { id: key, isModified: true, name: file.name, size: file.size, source: file };
}

function toMediaItem(key: string, row: PhotoListRow): SortableMediaItem {
  if (row.status === "new") return toFileItem(key, row.file);

  return row.file ? toFileItem(key, row.file) : { ...imageToMediaItem(row.photo), id: key };
}

/**
 * An ordered list of photos with their descriptions, in the `photos` field of a form (see
 * `photoListForm`); it reads the form from its context.
 */
export function PhotoListField({
  altPlaceholder,
  className,
  isSaving,
  label,
  maxPhotos,
  savedPhotos,
}: PhotoListFieldProps) {
  const { clearErrors, control, register, setError, setFocus, setValue } =
    useFormContext<PhotoListFormValues>();
  const { errors, isSubmitted } = useFormState({ control });
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, move, remove } = useFieldArray({ control, name: "photos" });
  const rows = useWatch({ control, name: "photos" });
  const items = fields.map((field, index) => toMediaItem(field.id, rows[index] ?? field));

  // Added rows are highlighted by themselves; the list shows that saved photos were removed or
  // moved.
  const savedOrder = savedPhotos.map((photo) => photo.id).join("\n");
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
      setError("root.photosRejection", { message });
    } else {
      clearErrors("root.photosRejection");
    }
  }

  function clearAlt(index: number) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(`photos.${index}.alt`, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(`photos.${index}.alt`);
  }

  return (
    <div className={clsx(styles.root, className)}>
      <SortableMediaList
        label={label}
        rules={imageUploadRules}
        maxItems={maxPhotos}
        items={items}
        disabled={isSaving}
        error={
          errors.root?.photosRejection?.message ??
          errors.photos?.message ??
          errors.photos?.root?.message
        }
        isModified={rowsOrder !== savedOrder}
        // The focus goes to the description of the first added photo.
        onAdd={(files) => append(files.map((file) => ({ alt: "", file, status: "new" })))}
        onMove={move}
        onRejectionChange={handleRejectionChange}
        onRemove={(key) => remove(getRowIndex(key))}
        onReplace={(key, file) =>
          setValue(`photos.${getRowIndex(key)}.file`, file, { shouldDirty: true })
        }
        renderItemFields={(item, index) => {
          const row = rows[index];

          return (
            <ClearableInput
              label="Описание"
              aria-label={`Описание ${item.name}`}
              placeholder={altPlaceholder}
              disabled={isSaving}
              error={errors.photos?.[index]?.alt?.message}
              isModified={row?.status === "saved" && row.alt !== row.photo.alt}
              hasValue={Boolean(row?.alt)}
              clearLabel={`Очистить описание ${item.name}`}
              onClear={() => clearAlt(index)}
              {...register(`photos.${index}.alt`)}
            />
          );
        }}
      />
    </div>
  );
}
