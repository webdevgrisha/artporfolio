import clsx from "clsx";
import React from "react";
import { useForm } from "react-hook-form";

import type { SitePages } from "@/entities/site-page";
import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ArrowLeftIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Spinner } from "@/shared/ui/spinner";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { getPageHeroesChanges } from "../model/getPageHeroesChanges";
import { heroFields } from "../model/heroFields";
import type { PageHeroesChanges } from "../model/pageHeroesChanges";
import {
  type PageHeroesFormValues,
  toHeroValue,
  toPageHeroesFormValues,
} from "../model/pageHeroesFormValues";
import type { SavePageHeroesResult } from "../model/savePageHeroes";
import styles from "./EditPageHeroesForm.module.css";
import { PageHeroField } from "./PageHeroField";

const revertLabel = "Отменить изменения";

interface EditPageHeroesFormProps {
  className?: string;
  isSaving: boolean;
  onSubmit: (changes: PageHeroesChanges) => void;
  /** The result of the last save. The pages it returns become the baseline of their fields. */
  saveResult: SavePageHeroesResult | undefined;
  /** The last saved pages, including the ones saved by `saveResult`. */
  savedPages: SitePages;
}

export function EditPageHeroesForm({
  className,
  isSaving,
  onSubmit,
  saveResult,
  savedPages,
}: EditPageHeroesFormProps) {
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
    resetField,
  } = useForm<PageHeroesFormValues>({
    defaultValues: toPageHeroesFormValues(savedPages),
  });
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);
  const unsavedChangesGuard = useUnsavedChangesGuard(isDirty);

  // What was saved is no longer modified. A page that failed is not in the result, so its field
  // keeps the unsaved change.
  React.useEffect(() => {
    if (!saveResult) return;

    for (const { page } of heroFields) {
      const savedPage = saveResult.pages[page];
      if (savedPage) resetField(page, { defaultValue: toHeroValue(savedPage.hero) });
    }
  }, [resetField, saveResult]);

  function revertChanges() {
    reset();
    // The revert button disappears together with the changes, so the focus moves to its neighbour.
    saveButtonRef.current?.focus();
  }

  function submitChanges(submittedValues: PageHeroesFormValues) {
    onSubmit(getPageHeroesChanges(submittedValues, savedPages));
  }

  return (
    <form className={clsx(styles.root, className)} onSubmit={handleSubmit(submitChanges)}>
      <div className={styles.fields}>
        {heroFields.map(({ label, page }) => (
          <PageHeroField
            key={page}
            control={control}
            disabled={isSaving}
            label={label}
            page={page}
            serverHero={savedPages[page].hero}
          />
        ))}
      </div>

      <div className={styles.actions}>
        {isDirty ? (
          <Tooltip content={revertLabel}>
            <IconButton label={revertLabel} disabled={isSaving} onClick={revertChanges}>
              <ArrowLeftIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        <Button
          ref={saveButtonRef}
          className={styles.saveButton}
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner />
              <VisuallyHidden>Сохранение</VisuallyHidden>
            </>
          ) : (
            "Сохранить"
          )}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={unsavedChangesGuard.isBlocked}
        title="Уйти без сохранения?"
        description="Несохранённые изменения будут потеряны."
        cancelLabel="Остаться"
        confirmLabel="Уйти"
        onCancel={unsavedChangesGuard.stay}
        onConfirm={unsavedChangesGuard.leave}
      />
    </form>
  );
}
