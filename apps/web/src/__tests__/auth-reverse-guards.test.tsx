import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";

vi.mock("../lib/auth", () => ({
  useSession: vi.fn(),
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useSession } from "../lib/auth";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login reverse guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / when already authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", email: "test@test.com" }, session: {} },
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderLogin();

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("auth.login")).not.toBeInTheDocument();
  });

  it("shows login form when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderLogin();

    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
    // Form elements should be present
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
  });

  it("shows spinner while session is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useSession>);

    const { container } = renderLogin();

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

describe("Register reverse guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / when already authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", email: "test@test.com" }, session: {} },
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderRegister();

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("shows register form when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    renderRegister();

    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
    expect(screen.getByLabelText("auth.name")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
  });

  it("shows spinner while session is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useSession>);

    const { container } = renderRegister();

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
