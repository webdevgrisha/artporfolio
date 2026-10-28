import { useObjectUrl } from "@/shared/lib/useObjectUrl";

interface MediaImageProps {
  className?: string;
  source: File | string;
}

/** An image of a picked file or from a URL. Decorative: the file name is always shown with it. */
export function MediaImage({ className, source }: MediaImageProps) {
  const objectUrl = useObjectUrl(source instanceof File ? source : undefined);
  const src = typeof source === "string" ? source : objectUrl;

  return src ? <img className={className} src={src} alt="" decoding="async" /> : null;
}
