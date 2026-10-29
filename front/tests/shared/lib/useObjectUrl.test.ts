import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useObjectUrl } from "@/shared/lib/useObjectUrl";

import { imageFile } from "../../support/images";

beforeEach(() => {
  let count = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
    count += 1;
    return `blob:test/${String(count)}`;
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useObjectUrl", () => {
  it("is undefined without a file", () => {
    const { result } = renderHook(() => useObjectUrl(undefined));

    expect(result.current).toBeUndefined();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("revokes the URL of the previous file when the file changes", () => {
    const { rerender, result } = renderHook(({ file }) => useObjectUrl(file), {
      initialProps: { file: imageFile("first.png") },
    });
    expect(result.current).toBe("blob:test/1");

    rerender({ file: imageFile("second.png") });

    expect(result.current).toBe("blob:test/2");
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:test/1");
  });

  it("revokes the URL when the file is removed", () => {
    const { rerender, result } = renderHook(({ file }) => useObjectUrl(file), {
      initialProps: { file: imageFile() as File | undefined },
    });

    rerender({ file: undefined });

    expect(result.current).toBeUndefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:test/1");
  });

  it("revokes the URL on unmount", () => {
    const file = imageFile();
    const { unmount } = renderHook(() => useObjectUrl(file));

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:test/1");
  });
});
