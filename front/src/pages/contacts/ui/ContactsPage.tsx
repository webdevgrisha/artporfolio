import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

import { contactsQuery } from "@/entities/contacts";
import { EditContactLinksForm, EditContactPhotoForm } from "@/features/edit-contacts";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";

import styles from "./ContactsPage.module.css";

type ContactsTab = "links" | "photo";

export function ContactsPage() {
  // The route loader has fetched the data, so this never suspends.
  const { data } = useSuspenseQuery(contactsQuery);
  const [tab, setTab] = React.useState<ContactsTab>("links");

  // Each tab is a form of its own: the links and the photo are saved independently.
  return (
    <div className={styles.root}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabList label="Разделы контактов">
          <Tab value="links">Соц. сети</Tab>
          <Tab value="photo">Фото</Tab>
        </TabList>

        <TabPanel className={styles.panel} value="links">
          <EditContactLinksForm className={styles.form} contacts={data.contacts} />
        </TabPanel>
        <TabPanel className={styles.panel} value="photo">
          <EditContactPhotoForm className={styles.form} photo={data.photo} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
