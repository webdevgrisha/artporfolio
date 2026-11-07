import React from "react";

/**
 * Which Russian text each field was written from: the one it showed when the person began to change
 * it. The Russian text may change while the field stays as typed, and the server then shows that
 * translation as out of date.
 */
export function useWrittenFrom(
  sources: Record<string, string> | undefined,
  changed: Partial<Record<string, boolean>>,
): (key: string) => string {
  const originals = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    for (const [key, source] of Object.entries(sources ?? {})) {
      if (!changed[key]) {
        originals.current[key] = source;
      }
    }
  });

  return (key) => originals.current[key] ?? sources?.[key] ?? "";
}
