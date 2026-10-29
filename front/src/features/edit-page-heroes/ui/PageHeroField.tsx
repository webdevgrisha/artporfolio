import { type Control, useController } from "react-hook-form";

import type { SitePageId } from "@/entities/site-page";
import type { Image } from "@/shared/api/image";
import { ImagePicker } from "@/shared/ui/image-picker";

import type { PageHeroesFormValues } from "../model/pageHeroesFormValues";

interface PageHeroFieldProps {
  control: Control<PageHeroesFormValues>;
  disabled: boolean;
  /** Why a picked file was refused. */
  error?: string;
  label: string;
  /** Receives why a file was refused, or `undefined` once the message is outdated. */
  onRejectionChange: (message: string | undefined) => void;
  page: SitePageId;
  /** The hero on the server, shown while the field keeps it. */
  serverHero: Image | null;
}

/** The hero of one page in `EditPageHeroesForm`. */
export function PageHeroField({
  control,
  disabled,
  error,
  label,
  onRejectionChange,
  page,
  serverHero,
}: PageHeroFieldProps) {
  const { field } = useController({ control, name: page });

  return (
    <ImagePicker
      label={label}
      value={field.value}
      serverImage={serverHero}
      disabled={disabled}
      error={error}
      onChange={field.onChange}
      onRejectionChange={onRejectionChange}
    />
  );
}
