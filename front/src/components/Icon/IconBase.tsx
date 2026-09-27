import type { ReactNode, SVGProps } from "react";

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "height" | "viewBox" | "width"> {
  title?: string;
}

interface IconBaseProps extends IconProps {
  children: ReactNode;
  height: number;
  viewBox: string;
  width: number;
}

export function IconBase({ children, height, title, viewBox, width, ...svgProps }: IconBaseProps) {
  return (
    // Decorative icons are hidden from assistive technology unless a title is provided.
    // biome-ignore lint/a11y/noSvgWithoutTitle: The title is optional for decorative icons.
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...svgProps}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
