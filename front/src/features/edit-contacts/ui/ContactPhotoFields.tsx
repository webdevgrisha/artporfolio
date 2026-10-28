import clsx from "clsx";
import React from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { ContactPhoto } from "@/entities/contacts";
import { Input } from "@/shared/ui/input";
import { type MediaItem, MediaPicker } from "@/shared/ui/media-picker";

import { type ContactsFormValues, savedPhoto } from "../model/contactsFormSchema";
import { photoRules } from "../model/photoRules";
import styles from "./ContactPhotoFields.module.css";

interface ContactPhotoFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo on the server, shown while the photo field keeps it. */
  serverPhoto: ContactPhoto | null;
}

/** The photo tab of `EditContactsForm`; it reads the form from its context. */
export function ContactPhotoFields({ className, isSaving, serverPhoto }: ContactPhotoFieldsProps) {
  const { control, register, setValue } = useFormContext<ContactsFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  const photo = useWatch({ control, name: "photo" });

  const photoItems = React.useMemo((): MediaItem[] => {
    if (photo instanceof File) {
      return [{ id: "picked", name: photo.name, size: photo.size, source: photo }];
    }

    // Ordered by width: the smallest one for the thumbnail, the largest for the preview dialog.
    const images = serverPhoto?.sources.webp ?? [];
    const thumbnail = images.at(0);
    if (photo !== savedPhoto || !serverPhoto || !thumbnail) return [];

    return [
      {
        fullSizeSource: images.at(-1)?.url,
        id: serverPhoto.version,
        name: serverPhoto.fileName,
        size: serverPhoto.fileSize,
        source: thumbnail.url,
      },
    ];
  }, [photo, serverPhoto]);

  function setPhoto(value: ContactsFormValues["photo"]) {
    setValue("photo", value, { shouldDirty: true, shouldValidate: isSubmitted });
  }

  return (
    <div className={clsx(styles.root, className)}>
      <MediaPicker
        label="Фото"
        accept={photoRules.accept}
        acceptLabel={photoRules.acceptLabel}
        maxFileSize={photoRules.maxFileSize}
        items={photoItems}
        disabled={isSaving}
        isModified={photo !== (serverPhoto ? savedPhoto : null)}
        onAdd={([file]) => setPhoto(file ?? null)}
        onRemove={() => setPhoto(null)}
      />
      {/* Without a photo there is nothing to describe; the text comes back with the photo. */}
      {photo === null ? null : (
        <Input
          label="Описание фото"
          placeholder="Что на фото: для незрячих и поисковиков"
          disabled={isSaving}
          error={errors.photoAlt?.message}
          isModified={Boolean(dirtyFields.photoAlt)}
          {...register("photoAlt")}
        />
      )}
    </div>
  );
}
