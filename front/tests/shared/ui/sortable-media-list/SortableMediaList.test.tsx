import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { imageUploadRules } from "@/shared/api/image";
import { type SortableMediaItem, SortableMediaList } from "@/shared/ui/sortable-media-list";

import { imageFile } from "../../../support/images";

function setUp(item: Partial<SortableMediaItem>) {
  const file = imageFile();
  const onRemove = vi.fn();

  render(
    <SortableMediaList
      label="Фото"
      rules={imageUploadRules}
      maxItems={5}
      items={[{ id: "row", name: "etude.png", size: file.size, source: file, ...item }]}
      onAdd={vi.fn()}
      onMove={vi.fn()}
      onRejectionChange={vi.fn()}
      onRemove={onRemove}
      onReplace={vi.fn()}
    />,
  );

  return { onRemove };
}

function clickRemove() {
  fireEvent.click(screen.getByRole("button", { name: /^Удалить etude/ }));
}

describe("SortableMediaList", () => {
  it("removes a photo not saved yet at once", () => {
    const { onRemove } = setUp({ isSaved: false });

    clickRemove();

    expect(onRemove).toHaveBeenCalledWith("row");
  });

  it("asks before removing a saved photo, and removes it on the confirmation", async () => {
    const { onRemove } = setUp({ isSaved: true });

    clickRemove();
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole("button", { name: "Удалить", hidden: true }));

    await vi.waitFor(() => expect(onRemove).toHaveBeenCalledWith("row"));
  });

  it("keeps a saved photo when the question is cancelled", async () => {
    const { onRemove } = setUp({ isSaved: true });

    clickRemove();
    fireEvent.click(await screen.findByRole("button", { name: "Отмена", hidden: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onRemove).not.toHaveBeenCalled();
  });
});
