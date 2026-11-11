import avif from "@/shared/assets/images/portraitMark.png?w=80;160;240;320;400;473&format=avif&as=srcset";
import webp from "@/shared/assets/images/portraitMark.png?w=80;160;240;320;400;473&format=webp&as=srcset";
import fallback from "@/shared/assets/images/portraitMark.png?w=473&format=webp";

import styles from "./Portrait.module.css";

interface PortraitProps {
  className?: string;
  /** The width the portrait takes on the screen, as `sizes` of <img>, such as "72px". */
  sizes: string;
}

/**
 * The portrait of the artist, which the browser gets as AVIF or, when it cannot show that, as
 * WebP, at the width the screen needs: sharp on a Retina screen, light on any other. Decorative.
 */
export function Portrait({ className, sizes }: PortraitProps) {
  return (
    <picture className={styles.picture}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img
        className={className}
        src={fallback}
        srcSet={webp}
        sizes={sizes}
        alt=""
        decoding="async"
      />
    </picture>
  );
}
