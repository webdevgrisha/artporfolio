import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutTextQuery } from "@/entities/about";
import { EditAboutTextForm, EditAboutTextFormSkeleton } from "@/features/edit-about";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./AboutPage.module.css";

export function AboutTextSection() {
  return (
    <AwaitPageData fallback={<EditAboutTextFormSkeleton className={styles.form} />}>
      <AboutText />
    </AwaitPageData>
  );
}

function AboutText() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: text } = useSuspenseQuery(aboutTextQuery);

  return <EditAboutTextForm className={styles.form} text={text} />;
}
