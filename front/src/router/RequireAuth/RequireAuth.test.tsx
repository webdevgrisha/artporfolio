import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "@/contexts/Auth/AuthContext";
import type { AuthContextValue } from "@/contexts/Auth/types";
import { RequireAuth } from "@/router/RequireAuth/RequireAuth";

afterEach(cleanup);

function renderWithAuth(auth: Partial<AuthContextValue>) {
  const value: AuthContextValue = {
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    ...auth,
  };
  const router = createMemoryRouter(
    [
      { path: "/admin/login", element: <p>Login page</p> },
      {
        element: <RequireAuth />,
        children: [{ path: "/admin/projects", element: <p>Projects page</p> }],
      },
    ],
    { initialEntries: ["/admin/projects"] },
  );

  render(
    <AuthContext.Provider value={value}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe("RequireAuth", () => {
  it("shows a loading state while the session is checked", () => {
    renderWithAuth({ isLoading: true });

    expect(screen.getByRole("status", { name: "Проверка авторизации" })).toBeTruthy();
  });

  it("redirects a guest to the login page", async () => {
    renderWithAuth({ user: null });

    expect(await screen.findByText("Login page")).toBeTruthy();
  });

  it("renders the protected page for an authenticated user", async () => {
    renderWithAuth({ user: { email: "admin@example.com", uid: "admin-uid" } });

    expect(await screen.findByText("Projects page")).toBeTruthy();
  });
});
