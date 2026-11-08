import clsx from "clsx";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Photo } from "@/shared/api/photo";
import type { PhotoFormValues } from "@/shared/lib/photoForm";
import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ImagePicker } from "@/shared/ui/image-picker";

import styles from "./PhotoFields.module.css";

interface PhotoFieldsProps {
  /** An example description, for the placeholder of the description field. */
  altPlaceholder: string;
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
export function PhotoFields({
  altPlaceholder,
  className,
  isSaving,
  label,
  serverPhoto,
}: PhotoFieldsProps) {
  const { clearErrors, control, register, setError } = useFormContext<PhotoFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<PhotoFormValues>();
  // A controller registers the field: react-hook-form resets only registered fields, so without
  // it a save would not update the photo's saved value and a revert would bring back the old one.
  const { field: photoField } = useController({ control, name: "photo" });
  const photoAlt = useWatch({ control, name: "photoAlt" });

  function handleRejectionChange(message: string | undefined) {
    // A root error, unlike a field error, is not replaced by the validation of the field; the
    // form drops it on a save or a revert.
    if (message) {
      setError("root.photoRejection", { message });
    } else {
      clearErrors("root.photoRejection");
    }
  }

  return (
    <div className={clsx(styles.root, className)}>
      <ImagePicker
        label={label}
        value={photoField.value}
        serverImage={serverPhoto}
        disabled={isSaving}
        error={errors.root?.photoRejection?.message ?? errors.photo?.message}
        onChange={photoField.onChange}
        onRejectionChange={handleRejectionChange}
      />
      {/* Until a photo is picked there is nothing to describe. */}
      {photoField.value === null ? null : (
        <ClearableInput
          label="Описание фото"
          hint="Коротко: что на фото. Это прочитают незрячие и поисковики"
          placeholder={altPlaceholder}
          disabled={isSaving}
          error={errors.photoAlt?.message}
          isModified={Boolean(dirtyFields.photoAlt)}
          hasValue={Boolean(photoAlt)}
          clearLabel="Очистить описание фото"
          onClear={() => clearField("photoAlt")}
          {...register("photoAlt")}
        />
      )}
    </div>
  );
}
