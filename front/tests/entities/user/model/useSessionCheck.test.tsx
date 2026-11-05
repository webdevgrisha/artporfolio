import { act, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import {
  MemoryRouter,
  type NavigateFunction,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { describe, expect, it, vi } from "vitest";

import { useSessionCheck } from "@/entities/user";

import { problem } from "../../../support/handlers";
import { server } from "../../../support/server";

const user = { email: "admin@example.com", uid: "admin-uid" };

let navigate: NavigateFunction;

function renderAdmin() {
  /** A page of the admin, whose layout checks the session. */
  function AdminPage() {
    useSessionCheck();
    navigate = useNavigate();

    return <p>{useLocation().pathname}</p>;
  }

  /** The login page, outside the layout. */
  function LoginPage() {
    return <p>Вход{useLocation().search}</p>;
  }

  render(
    <MemoryRouter initialEntries={["/admin/about"]}>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="*" element={<AdminPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("useSessionCheck", () => {
  it("leaves the page the admin was entered on to the loader, which has just checked it", async () => {
    const check = vi.fn(() => HttpResponse.json(user));
    server.use(mswHttp.get("/api/auth/me", check));

    renderAdmin();

    await act(() => Promise.resolve());
    expect(check).not.toHaveBeenCalled();
  });

  it("stays on the page while the session is valid", async () => {
    const check = vi.fn(() => HttpResponse.json(user));
    server.use(mswHttp.get("/api/auth/me", check));
    renderAdmin();

    await act(() => navigate("/admin/contacts"));

    await waitFor(() => expect(check).toHaveBeenCalledOnce());
    expect(screen.getByText("/admin/contacts")).toBeTruthy();
  });

  it("sends an ended session to the login page, which brings it back", async () => {
    server.use(mswHttp.get("/api/auth/me", () => problem(401)));
    renderAdmin();

    await act(() => navigate("/admin/contacts"));

    expect(await screen.findByText("Вход?redirectTo=%2Fadmin%2Fcontacts")).toBeTruthy();
  });

  it("stays on the page for any other failure, which says nothing about the session", async () => {
    const check = vi.fn(() => problem(503));
    server.use(mswHttp.get("/api/auth/me", check));
    renderAdmin();

    await act(() => navigate("/admin/contacts"));

    await waitFor(() => expect(check).toHaveBeenCalled());
    expect(screen.getByText("/admin/contacts")).toBeTruthy();
  });
});
