import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./ContactsPage.module.css";

const sections = [
  { label: "Соц. сети", to: routes.contactLinks },
  { label: "Фото", to: routes.contactPhoto },
] as const;

/** The links and the photo are saved independently, so each is a section with its own URL. */
export function ContactsPage() {
  return (
    <div className={styles.root}>
      <TabNav label="Разделы контактов" items={sections} />
      <Outlet />
    </div>
  );
}
