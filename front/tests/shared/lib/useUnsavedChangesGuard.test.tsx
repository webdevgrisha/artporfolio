import { act, render } from "@testing-library/react";
import React from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";

type Guard = ReturnType<typeof useUnsavedChangesGuard>;

/** Opens a page that uses the guard; the test changes its unsaved state and reads the guard. */
function renderGuardedPage(hasUnsavedChanges: boolean) {
  const page: { guard?: Guard; setHasUnsavedChanges?: (value: boolean) => void } = {};

  function GuardedPage() {
    const [hasChanges, setHasChanges] = React.useState(hasUnsavedChanges);
    page.guard = useUnsavedChangesGuard(hasChanges);
    page.setHasUnsavedChanges = setHasChanges;
    return null;
  }

  const router = createMemoryRouter(
    [
      { element: <GuardedPage />, path: "/admin/about" },
      { element: null, path: "/admin/contacts" },
    ],
    { initialEntries: ["/admin/about"] },
  );
  render(<RouterProvider router={router} />);

  return {
    get guard(): Guard {
      if (!page.guard) throw new Error("The page is not rendered");
      return page.guard;
    },
    pathname: () => router.state.location.pathname,
    navigate: (to: string) => act(() => router.navigate(to)),
    setHasUnsavedChanges: (value: boolean) => act(() => page.setHasUnsavedChanges?.(value)),
  };
}

/** Closes or reloads the tab; true if the page asked to stay. */
function unloadPage(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);

  return event.defaultPrevented;
}

describe("useUnsavedChangesGuard", () => {
  it("lets the user leave a page without changes", async () => {
    const page = renderGuardedPage(false);

    await page.navigate("/admin/contacts");

    expect(page.pathname()).toBe("/admin/contacts");
    expect(unloadPage()).toBe(false);
  });

  it("holds the navigation away from unsaved changes until the user leaves", async () => {
    const page = renderGuardedPage(true);

    await page.navigate("/admin/contacts");
    expect(page.guard.isBlocked).toBe(true);
    expect(page.pathname()).toBe("/admin/about");

    await act(() => page.guard.leave());
    expect(page.pathname()).toBe("/admin/contacts");
  });

  it("keeps the user on the page when they stay", async () => {
    const page = renderGuardedPage(true);

    await page.navigate("/admin/contacts");
    await act(() => page.guard.stay());

    expect(page.guard.isBlocked).toBe(false);
    expect(page.pathname()).toBe("/admin/about");
  });

  it("does not hold a change of the search params, such as a tab", async () => {
    const page = renderGuardedPage(true);

    await page.navigate("/admin/about?tab=photo");

    expect(page.guard.isBlocked).toBe(false);
  });

  it("lets the held navigation go when the changes are saved meanwhile", async () => {
    const page = renderGuardedPage(true);

    await page.navigate("/admin/contacts");
    await page.setHasUnsavedChanges(false);

    expect(page.guard.isBlocked).toBe(false);
  });

  it("asks the browser to confirm closing the tab only while there are changes", async () => {
    const page = renderGuardedPage(true);
    expect(unloadPage()).toBe(true);

    await page.setHasUnsavedChanges(false);
    expect(unloadPage()).toBe(false);
  });
});
