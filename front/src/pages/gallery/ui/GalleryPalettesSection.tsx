import { palettesList } from "@/features/edit-gallery";

import { TitleListSection } from "./TitleListSection";

export function GalleryPalettesSection() {
  return <TitleListSection list={palettesList} />;
}
