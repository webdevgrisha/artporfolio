import React from "react";

import { type Image, imageUploadRules } from "@/shared/api/image";
import { type ImageFieldValue, savedImage, toImageFieldValue } from "@/shared/lib/imageFieldValue";
import { MediaPicker } from "@/shared/ui/media-picker";
import { imageToMediaItem, type MediaItem } from "@/shared/ui/media-preview";

interface ImagePickerProps {
  className?: string;
  disabled: boolean;
  label: string;
  /** A picked file, or `null` when the image is removed. */
  onChange: (value: File | null) => void;
  /** The image on the server, shown while the value keeps it. */
  serverImage: Image | null;
  value: ImageFieldValue;
}

/**
 * A `MediaPicker` for one image of the upload rules: it shows the image on the server or the
 * picked file, and highlights a value that differs from the server.
 */
export function ImagePicker({
  className,
  disabled,
  label,
  onChange,
  serverImage,
  value,
}: ImagePickerProps) {
  const items = React.useMemo((): MediaItem[] => {
    if (value instanceof File) {
      return [{ id: "picked", name: value.name, size: value.size, source: value }];
    }

    return value === savedImage && serverImage ? [imageToMediaItem(serverImage)] : [];
  }, [value, serverImage]);

  return (
    <MediaPicker
      className={className}
      label={label}
      rules={imageUploadRules}
      items={items}
      disabled={disabled}
      isModified={value !== toImageFieldValue(serverImage)}
      onAdd={([file]) => onChange(file)}
      onRemove={() => onChange(null)}
    />
  );
}
