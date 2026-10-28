import React from "react";

/** A URL for showing a local file, revoked when the file changes or the component unmounts. */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = React.useState<string>();

  React.useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
