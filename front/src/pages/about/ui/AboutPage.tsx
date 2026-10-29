import { useLoaderData } from "react-router";

import { EditAboutForm } from "@/features/edit-about";

import type { aboutLoader } from "../model/aboutRoute";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  const about = useLoaderData<typeof aboutLoader>();

  return (
    <div className={styles.root}>
      <EditAboutForm className={styles.form} about={about} />
    </div>
  );
}
