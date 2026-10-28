import clsx from "clsx";
import React from "react";
import { useForm } from "react-hook-form";

import type { SitePages } from "@/entities/site-page";
import { FormActions } from "@/shared/ui/form-actions";
import { UnsavedChangesDialog } from "@/shared/ui/unsaved-changes-dialog";

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

  // What was saved is no longer modified. A page that failed is not in the result, so its field
  // keeps the unsaved change.
  React.useEffect(() => {
    if (!saveResult) return;

    for (const { page } of heroFields) {
      const savedPage = saveResult.pages[page];
      if (savedPage) resetField(page, { defaultValue: toHeroValue(savedPage.hero) });
    }
  }, [resetField, saveResult]);

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

      <FormActions
        className={styles.actions}
        hasUnsavedChanges={isDirty}
        isSaving={isSaving}
        onRevert={() => reset()}
      />
      <UnsavedChangesDialog hasUnsavedChanges={isDirty} />
    </form>
  );
}
