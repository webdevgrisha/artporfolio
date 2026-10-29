import React from "react";
import { type Control, useController } from "react-hook-form";

import type { SitePageId } from "@/entities/site-page";
import { type Image, imageUploadRules } from "@/shared/api/image";
import { MediaPicker } from "@/shared/ui/media-picker";
import { imageToMediaItem, type MediaItem } from "@/shared/ui/media-preview";

import { type PageHeroesFormValues, savedHero } from "../model/pageHeroesFormValues";

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
  const hero = field.value;

  const items = React.useMemo((): MediaItem[] => {
    if (hero instanceof File) {
      return [{ id: "picked", name: hero.name, size: hero.size, source: hero }];
    }

    return hero === savedHero && serverHero ? [imageToMediaItem(serverHero)] : [];
  }, [hero, serverHero]);

  return (
    <MediaPicker
      label={label}
      rules={imageUploadRules}
      items={items}
      disabled={disabled}
      isModified={hero !== (serverHero ? savedHero : null)}
      onAdd={([file]) => field.onChange(file ?? null)}
      onRemove={() => field.onChange(null)}
    />
  );
}
