import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "height" | "viewBox" | "width">;

interface IconBaseProps extends IconProps {
  children: ReactNode;
  height: number;
  viewBox: string;
  width: number;
}

/** Icons are decorative and hidden from assistive technology: the control around one is named. */
export function IconBase({ children, height, viewBox, width, ...svgProps }: IconBaseProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...svgProps}
    >
      {children}
    </svg>
  );
}
