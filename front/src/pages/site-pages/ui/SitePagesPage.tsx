import React from "react";
import { useFetcher, useLoaderData } from "react-router";

import {
  EditPageHeroesForm,
  type PageHeroesChanges,
  pageHeroesChangesToFormData,
} from "@/features/edit-page-heroes";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";

import type { sitePagesAction, sitePagesLoader } from "../model/sitePagesRoute";
import styles from "./SitePagesPage.module.css";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "site-pages-save";

export function SitePagesPage() {
  const loadedPages = useLoaderData<typeof sitePagesLoader>();
  // A fetcher, not a navigation: saving stays on the page and adds no history entry.
  const fetcher = useFetcher<typeof sitePagesAction>();
  // Kept apart from fetcher.data, which the next save replaces.
  const [savedPages, setSavedPages] = React.useState(loadedPages);
  const saveResult = fetcher.data;

  React.useEffect(() => {
    if (!saveResult) return;

    // Only the saved pages are replaced; the form resets their fields from the same result.
    setSavedPages((previous) => ({ ...previous, ...saveResult.pages }));

    if (saveResult.error) {
      showErrorToast(saveResult.error, { id: saveToastId });
    } else {
      showSuccessToast("Изменения сохранены", { id: saveToastId });
    }
  }, [saveResult]);

  function handleSubmit(changes: PageHeroesChanges) {
    void fetcher.submit(pageHeroesChangesToFormData(changes), {
      encType: "multipart/form-data",
      method: "put",
    });
  }

  return (
    <div className={styles.root}>
      <EditPageHeroesForm
        className={styles.form}
        isSaving={fetcher.state !== "idle"}
        saveResult={saveResult}
        savedPages={savedPages}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
