import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutTextQuery } from "@/entities/about";
import { EditAboutTextForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutTextSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: text } = useSuspenseQuery(aboutTextQuery);

  return <EditAboutTextForm className={styles.form} text={text} />;
}
