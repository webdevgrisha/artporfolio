import { useSuspenseQuery } from "@tanstack/react-query";

import { processPhotosQuery } from "@/entities/about";
import { EditProcessPhotosForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutProcessSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: list } = useSuspenseQuery(processPhotosQuery);

  return <EditProcessPhotosForm className={styles.form} list={list} />;
}
