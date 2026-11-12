import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useController, useForm } from "react-hook-form";

import { maxSlideshowPhotos, type Slideshow } from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
import { toPhotoListRows } from "@/shared/lib/photoListForm";
import { Checkbox } from "@/shared/ui/checkbox";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { FieldHint } from "@/shared/ui/field";
import { Frame, FrameRow, FrameRowLabel } from "@/shared/ui/frame-list";
import { PhotoListField } from "@/shared/ui/photo-list-field";

import { type SlideshowFormValues, slideshowFormSchema } from "../model/slideshowFormSchema";
import { saveSlideshowFeedback, useSaveSlideshow } from "../model/useSaveSlideshow";
import styles from "./EditSlideshowForm.module.css";

interface EditSlideshowFormProps {
  className?: string;
  /** The slideshow as stored on the server when the form opens, with its ETag. */
  slideshow: Tagged<Slideshow>;
}

function toFormValues({ photos, source }: Slideshow): SlideshowFormValues {
  return { fromGallery: source === "gallery", photos: toPhotoListRows(photos) };
}

/**
 * The photos of the slideshow on the contacts page, or the choice to show the gallery in their
 * place; the uploaded photos stay, so unticking the box brings them back.
 */
export function EditSlideshowForm({ className, slideshow }: EditSlideshowFormProps) {
  const form = useForm<SlideshowFormValues>({
    defaultValues: toFormValues(slideshow.data),
    resolver: zodResolver(slideshowFormSchema),
  });
  const saveSlideshow = useSaveSlideshow();
  const { editForm, saved } = useSavedForm({
    form,
    initial: slideshow,
    save: (values, etag) => saveSlideshow.mutateAsync({ etag, values }),
    toValues: toFormValues,
    toastId: saveSlideshowFeedback.toastId,
  });
  // A checkbox always holds a value, so it is never invalid and needs no ref.
  const { field: fromGallery, fieldState } = useController({
    control: form.control,
    name: "fromGallery",
  });
  const fromGalleryId = React.useId();

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <div>
          <Frame className={styles.source} isModified={fieldState.isDirty}>
            <FrameRow>
              <FrameRowLabel htmlFor={fromGalleryId}>Показывать фото из галереи</FrameRowLabel>
              <Checkbox
                className={styles.checkbox}
                id={fromGalleryId}
                aria-describedby={`${fromGalleryId}-hint`}
                checked={fromGallery.value}
                disabled={editForm.isSaving}
                onBlur={fromGallery.onBlur}
                onChange={fromGallery.onChange}
              />
            </FrameRow>
          </Frame>
          <FieldHint id={`${fromGalleryId}-hint`}>
            Только горизонтальные работы. Ваши фото не удалятся
          </FieldHint>
        </div>
        <PhotoListField
          label="Фото"
          altPlaceholder="Например: Анастасия в мастерской"
          maxPhotos={maxSlideshowPhotos}
          disabled={fromGallery.value}
          isSaving={editForm.isSaving}
          savedPhotos={saved.data.photos}
        />
      </EditForm>
    </FormProvider>
  );
}
