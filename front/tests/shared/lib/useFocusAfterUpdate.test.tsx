import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";

describe("useFocusAfterUpdate", () => {
  it("focuses after the next render, once", () => {
    const focus = vi.fn();
    const { rerender, result } = renderHook(() => useFocusAfterUpdate());

    act(() => result.current(focus));
    expect(focus).not.toHaveBeenCalled();

    rerender();
    rerender();

    expect(focus).toHaveBeenCalledOnce();
  });
});
