import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./GalleryPage.module.css";

const sections = [{ label: "Основной текст", to: routes.galleryIntro }] as const;

/** The text above the works, the sections and the materials are saved independently. */
export function GalleryPage() {
  return (
    <div className={styles.root}>
      <div className={styles.sectionsBar}>
        <TabNav label="Разделы страницы «Галерея»" items={sections} />
      </div>
      <Outlet />
    </div>
  );
}
