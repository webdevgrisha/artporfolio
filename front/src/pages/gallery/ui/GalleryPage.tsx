import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./GalleryPage.module.css";

const sections = [
  { label: "Основной текст", to: routes.galleryIntro },
  { label: "Все работы", to: routes.galleryWorks },
  { label: "Разделы", to: routes.gallerySections },
  { label: "Материалы", to: routes.galleryMaterials },
  { label: "Цвета", to: routes.galleryColors },
  { label: "Палитры", to: routes.galleryPalettes },
] as const;

/**
 * The text above the works, the works, the sections, the materials, the colors and the palettes
 * are saved independently.
 */
export function GalleryPage() {
  return (
    <div className={styles.root}>
      <TabNav label="Разделы страницы «Галерея»" items={sections} />
      <Outlet />
    </div>
  );
}
