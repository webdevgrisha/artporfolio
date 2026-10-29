import { type Control, useController } from "react-hook-form";

import type { SitePageId } from "@/entities/site-page";
import type { Image } from "@/shared/api/image";
import { ImagePicker } from "@/shared/ui/image-picker";

import type { PageHeroesFormValues } from "../model/pageHeroesFormValues";

interface PageHeroFieldProps {
  control: Control<PageHeroesFormValues>;
  disabled: boolean;
  label: string;
  page: SitePageId;
  /** The hero on the server, shown while the field keeps it. */
  serverHero: Image | null;
}

/** The hero of one page in `EditPageHeroesForm`. */
export function PageHeroField({ control, disabled, label, page, serverHero }: PageHeroFieldProps) {
  const { field } = useController({ control, name: page });

  return (
    <ImagePicker
      label={label}
      value={field.value}
      serverImage={serverHero}
      disabled={disabled}
      onChange={field.onChange}
    />
  );
}
