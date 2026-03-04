import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";

vi.mock("../lib/auth", () => ({
  useSession: vi.fn(),
}));

import { useSession } from "../lib/auth";

function renderWithRouter(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<div>Dashboard</div>} />
          <Route path="invoices" element={<div>Invoices Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no session", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderWithRouter("/");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("renders child routes when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", email: "test@test.com" }, session: {} },
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderWithRouter("/");

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("renders nested protected routes when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", email: "test@test.com" }, session: {} },
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderWithRouter("/invoices");

    expect(screen.getByText("Invoices Page")).toBeInTheDocument();
  });

  it("shows loading spinner while session is pending", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useSession>);

    const { container } = renderWithRouter("/");

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from nested routes to /login", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderWithRouter("/invoices");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Invoices Page")).not.toBeInTheDocument();
  });
});
