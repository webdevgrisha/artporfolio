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

function toMediaItem(value: ImageFieldValue, serverImage: Image | null): MediaItem | undefined {
  if (value instanceof File) {
    return { id: "picked", name: value.name, size: value.size, source: value };
  }

  return value === savedImage && serverImage ? imageToMediaItem(serverImage) : undefined;
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
  return (
    <MediaPicker
      className={className}
      label={label}
      rules={imageUploadRules}
      item={toMediaItem(value, serverImage)}
      disabled={disabled}
      isModified={value !== toImageFieldValue(serverImage)}
      onPick={onChange}
      onRemove={() => onChange(null)}
    />
  );
}
