import { useId } from "react";

import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function HeartIcon(props: IconProps) {
  const maskId = useId();

  return (
    <IconBase width={41.402} height={41.402} viewBox="-6.065 -6.062 41.402 41.402" {...props}>
      <g transform="rotate(45.04 14.636 14.639)">
        <mask id={maskId} fill="white">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.903 0a8.364 8.364 0 0 0-8.364 8.364v4.187H8.364a8.364 8.364 0 1 0 0 16.728h20.909V12.551h-.007V8.364A8.364 8.364 0 0 0 20.903 0Z"
          />
        </mask>
        <path
          d="M12.539 12.551v1.5h1.5v-1.5h-1.5Zm16.734 16.728v1.5h1.5v-1.5h-1.5Zm0-16.728h1.5v-1.5h-1.5v1.5Zm-.007 0h-1.5v1.5h1.5v-1.5ZM12.539 8.364h1.5A6.864 6.864 0 0 1 20.903 1.5V-1.5a9.864 9.864 0 0 0-9.864 9.864h1.5Zm0 4.187h1.5V8.364h-3v4.187h1.5Zm-4.175 0v1.5h4.175v-3H8.364v1.5ZM0 20.915h1.5a6.864 6.864 0 0 1 6.864-6.864v-3A9.864 9.864 0 0 0-1.5 20.915H0Zm8.364 8.364v-1.5A6.864 6.864 0 0 1 1.5 20.915h-3a9.864 9.864 0 0 0 9.864 9.864v-1.5Zm20.909 0v-1.5H8.364v3h20.909v-1.5Zm0-16.728h-1.5v16.728h3V12.551h-1.5Zm-.007 0v1.5h.007v-3h-.007v1.5Zm0-4.187h-1.5v4.187h3V8.364h-1.5ZM20.903 0v1.5a6.864 6.864 0 0 1 6.863 6.864h3A9.864 9.864 0 0 0 20.903-1.5V0Z"
          fill="currentColor"
          mask={`url(#${maskId})`}
        />
      </g>
    </IconBase>
  );
}
