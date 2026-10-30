import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

import { aboutQuery } from "@/entities/about";
import {
  EditAboutPhotoForm,
  EditAboutTextForm,
  EditProcessPhotosForm,
} from "@/features/edit-about";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";

import styles from "./AboutPage.module.css";

type AboutTab = "photo" | "process" | "text";

export function AboutPage() {
  // The route loader has fetched the data, so this never suspends.
  const { data: about } = useSuspenseQuery(aboutQuery);
  const [tab, setTab] = React.useState<AboutTab>("text");

  // Each tab is a form of its own: the texts, «Моё фото» and the process photos are saved
  // independently.
  return (
    <div className={styles.root}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabList label="Разделы страницы «О сайте»">
          <Tab value="text">Тексты</Tab>
          <Tab value="photo">Моё фото</Tab>
          <Tab value="process">Процесс</Tab>
        </TabList>

        <TabPanel className={styles.panel} value="text">
          <EditAboutTextForm className={styles.form} text={about.text} />
        </TabPanel>
        <TabPanel className={styles.panel} value="photo">
          <EditAboutPhotoForm className={styles.form} photo={about.photo} />
        </TabPanel>
        <TabPanel className={styles.panel} value="process">
          <EditProcessPhotosForm className={styles.form} processPhotos={about.processPhotos} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
