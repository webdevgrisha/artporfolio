import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

import { pageHeroQuery } from "@/entities/site-page";
import { heroUploadRules, type Image } from "@/shared/api/image";
import { MediaPicker } from "@/shared/ui/media-picker";
import { imageToMediaItem, type MediaItem } from "@/shared/ui/media-preview";

import type { HeroField } from "../model/heroFields";
import { useUploadPageHero } from "../model/pageHeroMutations";

interface PageHeroCardProps {
  field: HeroField;
}

function toMediaItem(uploadingFile: File | undefined, hero: Image | null): MediaItem | undefined {
  // While a file is uploaded, the card shows it instead of the hero it replaces.
  if (uploadingFile) {
    return {
      id: "uploading",
      name: uploadingFile.name,
      size: uploadingFile.size,
      source: uploadingFile,
    };
  }

  return hero ? imageToMediaItem(hero) : undefined;
}

/**
 * The hero of one page. A picked file is uploaded at once: the heroes are independent, so there is
 * nothing to save together. A hero can be replaced, not removed: the site does not show a page
 * without one.
 */
export function PageHeroCard({ field }: PageHeroCardProps) {
  // The route loader has fetched every hero, so this never suspends. The card reads its own hero:
  // an upload changes this one alone.
  const { data: hero } = useSuspenseQuery(pageHeroQuery(field.page));
  const uploadHero = useUploadPageHero(field);
  const [rejection, setRejection] = React.useState<string>();

  return (
    <MediaPicker
      label={field.label}
      rules={heroUploadRules}
      item={toMediaItem(uploadHero.isPending ? uploadHero.variables.file : undefined, hero.data)}
      error={rejection}
      isBusy={uploadHero.isPending}
      onPick={(file) => uploadHero.mutate({ etag: hero.etag, file })}
      onRejectionChange={setRejection}
    />
  );
}
