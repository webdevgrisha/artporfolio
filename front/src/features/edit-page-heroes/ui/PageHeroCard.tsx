import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

import { pageHeroQuery } from "@/entities/site-page";
import { type Image, imageUploadRules } from "@/shared/api/image";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { MediaPicker } from "@/shared/ui/media-picker";
import { imageToMediaItem, type MediaItem } from "@/shared/ui/media-preview";

import type { HeroField } from "../model/heroFields";
import { useDeletePageHero, useUploadPageHero } from "../model/pageHeroMutations";

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
 * The hero of one page. A picked file is uploaded at once and a deletion is sent once confirmed:
 * the heroes are independent, so there is nothing to save together.
 */
export function PageHeroCard({ field }: PageHeroCardProps) {
  // The route loader has fetched every hero, so this never suspends. The card reads its own hero:
  // an upload or deletion changes this one alone.
  const { data: hero } = useSuspenseQuery(pageHeroQuery(field.page));
  const uploadHero = useUploadPageHero(field);
  const deleteHero = useDeletePageHero(field);
  const [rejection, setRejection] = React.useState<string>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  function confirmDelete() {
    setIsDeleteConfirmOpen(false);
    deleteHero.mutate({ etag: hero.etag });
  }

  return (
    <>
      <MediaPicker
        label={field.label}
        rules={imageUploadRules}
        item={toMediaItem(uploadHero.isPending ? uploadHero.variables.file : undefined, hero.data)}
        error={rejection}
        isBusy={uploadHero.isPending || deleteHero.isPending}
        onPick={(file) => uploadHero.mutate({ etag: hero.etag, file })}
        onRejectionChange={setRejection}
        onRemove={() => setIsDeleteConfirmOpen(true)}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`Удалить фото страницы «${field.label}»?`}
        description="Фото сразу пропадёт с сайта."
        cancelLabel="Отмена"
        confirmLabel="Удалить"
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
