import clsx from "clsx";
import React from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import type { ContactPhoto } from "@/entities/contacts";
import { imageUploadRules } from "@/shared/api/image";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { MediaPicker } from "@/shared/ui/media-picker";
import { imageToMediaItem, type MediaItem } from "@/shared/ui/media-preview";

import { type ContactsFormValues, savedPhoto } from "../model/contactsFormSchema";
import styles from "./ContactPhotoFields.module.css";

interface ContactPhotoFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo on the server, shown while the photo field keeps it. */
  serverPhoto: ContactPhoto | null;
}

/** The photo tab of `EditContactsForm`; it reads the form from its context. */
export function ContactPhotoFields({ className, isSaving, serverPhoto }: ContactPhotoFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<ContactsFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  // A controller registers the field: react-hook-form resets only registered fields, so without
  // it a save would not update the photo's saved value and a revert would bring back the old one.
  const { field: photoField } = useController({ control, name: "photo" });
  const photo = photoField.value;
  const photoAlt = useWatch({ control, name: "photoAlt" });

  function clearPhotoAlt() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("photoAlt", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("photoAlt");
  }

  const photoItems = React.useMemo((): MediaItem[] => {
    if (photo instanceof File) {
      return [{ id: "picked", name: photo.name, size: photo.size, source: photo }];
    }

    return photo === savedPhoto && serverPhoto ? [imageToMediaItem(serverPhoto)] : [];
  }, [photo, serverPhoto]);

  return (
    <div className={clsx(styles.root, className)}>
      <MediaPicker
        label="Фото"
        rules={imageUploadRules}
        items={photoItems}
        disabled={isSaving}
        isModified={photo !== (serverPhoto ? savedPhoto : null)}
        onAdd={([file]) => photoField.onChange(file ?? null)}
        onRemove={() => photoField.onChange(null)}
      />
      {/* Without a photo there is nothing to describe; the text comes back with the photo. */}
      {photo === null ? null : (
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
