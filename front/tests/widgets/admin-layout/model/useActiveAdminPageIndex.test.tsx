import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { useActiveAdminPageIndex } from "@/widgets/admin-layout/model/useActiveAdminPageIndex";

function activeIndexAt(pathname: string): number {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>
  );

  return renderHook(() => useActiveAdminPageIndex(), { wrapper }).result.current;
}

describe("useActiveAdminPageIndex", () => {
  it.each([
    ["/admin/gallery", 0],
    ["/admin/about", 2],
    // A page inside a section, such as a project.
    ["/admin/projects/42", 1],
    ["/admin/pages", 5],
  ])("finds the page of %s", (pathname, index) => {
    expect(activeIndexAt(pathname)).toBe(index);
  });

  it.each(["/admin/login", "/admin/aboutme"])("finds no page for %s", (pathname) => {
    expect(activeIndexAt(pathname)).toBe(-1);
  });
});
