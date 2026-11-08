import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRowEditing } from "@/features/edit-gallery/lists/model/useRowEditing";

function setUp() {
  const restore = vi.fn();
  const validate = vi.fn();
  const { result } = renderHook(() => useRowEditing<string>({ restore, validate }));

  return { restore, result, validate };
}

describe("useRowEditing", () => {
  it("opens one row at a time", () => {
    const { result } = setUp();

    act(() => result.current.rowEditing("a", 0, "Акварель", false).onStart());

    expect(result.current.rowEditing("a", 0, "Акварель", false).isEditing).toBe(true);
    expect(result.current.rowEditing("b", 1, "Масло", false).isEditing).toBe(false);
  });

  it("keeps a row with an error open", () => {
    const { result } = setUp();

    expect(result.current.rowEditing("a", 0, "", true).isEditing).toBe(true);
  });

  it("checks the row when its editing finishes", () => {
    const { restore, result, validate } = setUp();

    act(() => result.current.rowEditing("a", 0, "Акварель", false).onStart());
    act(() => result.current.rowEditing("a", 0, "Гуашь", false).onFinish());

    expect(validate).toHaveBeenCalledWith(0);
    expect(restore).not.toHaveBeenCalled();
    expect(result.current.rowEditing("a", 0, "Гуашь", false).isEditing).toBe(false);
  });

  it("brings back what the editing started from on a cancel", () => {
    const { restore, result } = setUp();

    act(() => result.current.rowEditing("a", 0, "Акварель", false).onStart());
    act(() => result.current.rowEditing("a", 0, "Гуашь", false).onCancel());

    expect(restore).toHaveBeenCalledWith(0, "Акварель");
  });

  it("never brings the start of another row into a row open for its error", () => {
    const { restore, result } = setUp();

    act(() => result.current.rowEditing("b", 1, "Масло", false).onStart());
    act(() => result.current.rowEditing("a", 0, "", true).onCancel());

    expect(restore).not.toHaveBeenCalled();
  });
});
