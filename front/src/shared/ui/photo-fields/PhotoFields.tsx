import clsx from "clsx";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Photo } from "@/shared/api/photo";
import type { PhotoFormValues } from "@/shared/lib/photoForm";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ImagePicker } from "@/shared/ui/image-picker";

import styles from "./PhotoFields.module.css";

interface PhotoFieldsProps {
  className?: string;
  isSaving: boolean;
  label: string;
  /** The photo on the server, shown while the photo field keeps it. */
  serverPhoto: Photo | null;
}

/**
 * A photo with its description. It reads the `photo` and `photoAlt` fields from the form context:
 * the form spreads `photoFieldsShape` into its schema.
 */
export function PhotoFields({ className, isSaving, label, serverPhoto }: PhotoFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<PhotoFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  // A controller registers the field: react-hook-form resets only registered fields, so without
  // it a save would not update the photo's saved value and a revert would bring back the old one.
  const { field: photoField } = useController({ control, name: "photo" });
  const photoAlt = useWatch({ control, name: "photoAlt" });

  function clearPhotoAlt() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("photoAlt", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("photoAlt");
  }

  return (
    <div className={clsx(styles.root, className)}>
      <ImagePicker
        label={label}
        value={photoField.value}
        serverImage={serverPhoto}
        disabled={isSaving}
        onChange={photoField.onChange}
      />
      {/* Without a photo there is nothing to describe; the text comes back with the photo. */}
      {photoField.value === null ? null : (
        <ClearableInput
          label="Описание фото"
          hint="Коротко: что на фото. Это прочитают незрячие и поисковики"
          placeholder="Например: Анастасия в мастерской"
          disabled={isSaving}
          error={errors.photoAlt?.message}
          isModified={Boolean(dirtyFields.photoAlt)}
          hasValue={Boolean(photoAlt)}
          clearLabel="Очистить описание фото"
          onClear={clearPhotoAlt}
          {...register("photoAlt")}
        />
      )}
    </div>
  );
}
