import clsx from "clsx";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";

import type { SitePages } from "@/entities/site-page";
import { toSavedImageFieldValue } from "@/shared/lib/imageFieldValue";
import { FormActions } from "@/shared/ui/form-actions";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";
import { UnsavedChangesDialog } from "@/shared/ui/unsaved-changes-dialog";

import { heroFields } from "../model/heroFields";
import { getPageHeroesChanges } from "../model/pageHeroesChanges";
import { type PageHeroesFormValues, toPageHeroesFormValues } from "../model/pageHeroesFormValues";
import { savePageHeroes } from "../model/savePageHeroes";
import styles from "./EditPageHeroesForm.module.css";
import { PageHeroField } from "./PageHeroField";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "page-heroes-save";

interface EditPageHeroesFormProps {
  className?: string;
  /** The pages as stored on the server, from the route loader. */
  pages: SitePages;
}

export function EditPageHeroesForm({ className, pages }: EditPageHeroesFormProps) {
  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
    resetField,
  } = useForm<PageHeroesFormValues>({
    defaultValues: toPageHeroesFormValues(pages),
  });
  const { revalidate } = useRevalidator();

  async function saveChanges(values: PageHeroesFormValues) {
    const { error, savedPages } = await savePageHeroes(getPageHeroesChanges(values, pages));

    if (savedPages.length > 0) {
      // A saved photo gets new URLs, so the route loads the pages again.
      await revalidate();
    }

    // What was saved is no longer modified; a page that failed keeps its unsaved change.
    for (const page of savedPages) {
      resetField(page, { defaultValue: toSavedImageFieldValue(values[page]) });
    }

    if (error) {
      showErrorToast(error, { id: saveToastId });
    } else {
      showSuccessToast("Изменения сохранены", { id: saveToastId });
    }
  }

  return (
    <form className={clsx(styles.root, className)} onSubmit={handleSubmit(saveChanges)}>
      <div className={styles.fields}>
        {heroFields.map(({ label, page }) => (
          <PageHeroField
            key={page}
            control={control}
            disabled={isSubmitting}
            label={label}
            page={page}
            serverHero={pages[page].hero}
          />
        ))}
      </div>

      <FormActions
        className={styles.actions}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
      />
      <UnsavedChangesDialog hasUnsavedChanges={isDirty} />
    </form>
  );
}
