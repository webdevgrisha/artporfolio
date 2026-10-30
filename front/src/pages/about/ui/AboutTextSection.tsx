import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutQuery } from "@/entities/about";
import { EditAboutTextForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutTextSection() {
  // The loader of the page has fetched the data, so this never suspends.
  const { data: about } = useSuspenseQuery(aboutQuery);

  return <EditAboutTextForm className={styles.form} text={about.text} />;
}
