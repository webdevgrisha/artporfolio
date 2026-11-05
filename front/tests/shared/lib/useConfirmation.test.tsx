import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useConfirmation } from "@/shared/lib/useConfirmation";

describe("useConfirmation", () => {
  it("holds the subject while the question is open", () => {
    const { result } = renderHook(() => useConfirmation<string>(vi.fn()));

    act(() => result.current.ask("work"));

    expect(result.current.pending).toBe("work");
  });

  it("acts on the subject once the question has closed", () => {
    const onConfirmed = vi.fn();
    const { result } = renderHook(() => useConfirmation<string>(onConfirmed));

    act(() => result.current.ask("work"));
    act(() => result.current.confirm());

    expect(result.current.pending).toBeUndefined();
    expect(onConfirmed).toHaveBeenCalledOnce();
    expect(onConfirmed).toHaveBeenCalledWith("work");
  });

  it("does nothing after a cancel", () => {
    const onConfirmed = vi.fn();
    const { result } = renderHook(() => useConfirmation<string>(onConfirmed));

    act(() => result.current.ask("work"));
    act(() => result.current.cancel());

    expect(result.current.pending).toBeUndefined();
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
