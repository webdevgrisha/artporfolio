import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "@/contexts/Auth/AuthContext";
import { Login } from "@/pages/Admin/Login/Login";

afterEach(cleanup);

function renderLoggedInLogin(from: unknown) {
  const router = createMemoryRouter(
    [
      { path: "/admin/login", element: <Login /> },
      { path: "/admin", element: <p>Admin home</p> },
      { path: "/admin/gallery", element: <p>Gallery page</p> },
    ],
    { initialEntries: [{ pathname: "/admin/login", state: { from } }] },
  );

  render(
    <AuthContext.Provider
      value={{
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        user: { email: "admin@example.com", uid: "admin-uid" },
      }}
    >
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe("Login", () => {
  it("returns an authenticated user to the requested admin page", async () => {
    renderLoggedInLogin("/admin/gallery");

    expect(await screen.findByText("Gallery page")).toBeTruthy();
  });

  it("ignores a redirect target outside the admin area", async () => {
    renderLoggedInLogin("https://example.com");

    expect(await screen.findByText("Admin home")).toBeTruthy();
  });
});
