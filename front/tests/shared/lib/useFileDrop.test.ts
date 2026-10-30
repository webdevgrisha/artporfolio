import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { useFileDrop } from "@/shared/lib/useFileDrop";

const target = document.createElement("div");
const child = target.appendChild(document.createElement("span"));

interface DragEventParams {
  relatedTarget?: EventTarget | null;
  /** What is dragged: `Files`, or `text/plain` for text. */
  type?: string;
}

/** A drag event over the drop target. */
function dragEvent({ relatedTarget = null, type = "Files" }: DragEventParams = {}) {
  return {
    currentTarget: target,
    dataTransfer: { dropEffect: "none", files: ["photo.png"], types: [type] },
    preventDefault: vi.fn(),
    relatedTarget,
  } as unknown as DragEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

function renderFileDrop(disabled = false) {
  const onDrop = vi.fn();
  const hook = renderHook(() => useFileDrop({ disabled, onDrop }));

  return { onDrop, result: hook.result };
}

describe("useFileDrop", () => {
  it("takes files dragged over the target from the browser", () => {
    const { result } = renderFileDrop();
    const event = dragEvent();

    act(() => result.current.dropTargetProps.onDragOver(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.dataTransfer.dropEffect).toBe("copy");
    expect(result.current.isDragOver).toBe(true);
  });

  it("leaves dragged text to the browser", () => {
    const { onDrop, result } = renderFileDrop();
    const dragOver = dragEvent({ type: "text/plain" });
    const drop = dragEvent({ type: "text/plain" });

    act(() => {
      result.current.dropTargetProps.onDragOver(dragOver);
      result.current.dropTargetProps.onDrop(drop);
    });

    expect(dragOver.preventDefault).not.toHaveBeenCalled();
    expect(drop.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isDragOver).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("passes on the dropped files", () => {
    const { onDrop, result } = renderFileDrop();
    const drop = dragEvent();

    act(() => {
      result.current.dropTargetProps.onDragOver(dragEvent());
      result.current.dropTargetProps.onDrop(drop);
    });

    expect(drop.preventDefault).toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalledWith(["photo.png"]);
    expect(result.current.isDragOver).toBe(false);
  });

  it("refuses files on a disabled target, without letting the browser open them", () => {
    const { onDrop, result } = renderFileDrop(true);
    const dragOver = dragEvent();
    const drop = dragEvent();

    act(() => {
      result.current.dropTargetProps.onDragOver(dragOver);
      result.current.dropTargetProps.onDrop(drop);
    });

    expect(dragOver.preventDefault).toHaveBeenCalled();
    expect(dragOver.dataTransfer.dropEffect).toBe("none");
    expect(result.current.isDragOver).toBe(false);
    expect(drop.preventDefault).toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("stays over the target while the drag moves onto a child element", () => {
    const { result } = renderFileDrop();

    act(() => result.current.dropTargetProps.onDragOver(dragEvent()));
    act(() => result.current.dropTargetProps.onDragLeave(dragEvent({ relatedTarget: child })));
    expect(result.current.isDragOver).toBe(true);

    act(() =>
      result.current.dropTargetProps.onDragLeave(dragEvent({ relatedTarget: document.body })),
    );
    expect(result.current.isDragOver).toBe(false);
  });
});
