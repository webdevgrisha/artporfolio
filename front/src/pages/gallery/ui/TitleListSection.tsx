import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryWorkUsageQuery } from "@/entities/gallery";

import { EditTitleListForm, type TitleListConfig } from "@/features/edit-gallery";
import { LanguageForm } from "@/features/edit-translations";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

interface TitleListSectionProps {
  list: TitleListConfig;
}

/** A tab of a list of titles, such as the materials. */
export function TitleListSection({ list }: TitleListSectionProps) {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isList>
          <FieldSkeleton />
          <ListSkeleton rows={10} />
        </FormSkeleton>
      }
    >
      <TitleList list={list} />
    </AwaitPageData>
  );
}

function TitleList({ list }: TitleListSectionProps) {
  const { data } = useSuspenseQuery(list.query);
  const { data: usage } = useSuspenseQuery(galleryWorkUsageQuery);

  return (
    <EditTitleListForm
      className={styles.form}
      languageForm={LanguageForm}
      list={list}
      data={data}
      usages={list.usages(usage)}
    />
  );
}
