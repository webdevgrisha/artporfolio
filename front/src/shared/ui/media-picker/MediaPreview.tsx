import { useObjectUrl } from "@/shared/lib/useObjectUrl";

interface MediaPreviewProps {
  className?: string;
  source: File | string;
}

export function MediaPreview({ className, source }: MediaPreviewProps) {
  const objectUrl = useObjectUrl(source instanceof File ? source : undefined);
  const src = typeof source === "string" ? source : objectUrl;

  // Decorative: the file name is shown next to the preview.
  return src ? <img className={className} src={src} alt="" decoding="async" /> : null;
}
