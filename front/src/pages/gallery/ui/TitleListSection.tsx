import { type QueryKey, useSuspenseQuery } from "@tanstack/react-query";

import { EditTitleListForm, type TitleListConfig } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

interface TitleListSectionProps<TData, TQueryKey extends QueryKey> {
  list: TitleListConfig<TData, TQueryKey>;
}

/** A tab of a list of titles, such as the materials. */
export function TitleListSection<TData, TQueryKey extends QueryKey>({
  list,
}: TitleListSectionProps<TData, TQueryKey>) {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton />
          <ListSkeleton rows={6} />
        </FormSkeleton>
      }
    >
      <TitleList list={list} />
    </AwaitPageData>
  );
}

function TitleList<TData, TQueryKey extends QueryKey>({
  list,
}: TitleListSectionProps<TData, TQueryKey>) {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data } = useSuspenseQuery(list.query);

  return <EditTitleListForm className={styles.form} list={list} data={data} />;
}
